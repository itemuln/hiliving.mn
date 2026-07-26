package com.hiliving.commerce.payment;

import com.hiliving.admin.audit.AuditService;
import com.hiliving.api.error.ApiRequestException;
import com.hiliving.catalog.product.persistence.ProductEntity;
import com.hiliving.catalog.product.persistence.ProductRepository;
import com.hiliving.commerce.order.OrderEntity;
import com.hiliving.commerce.order.OrderRepository;
import com.hiliving.commerce.order.OrderStatus;
import com.hiliving.commerce.order.PaymentMethod;
import com.hiliving.commerce.order.PaymentStatus;
import com.hiliving.email.EmailEventType;
import com.hiliving.email.OrderEmailPayloadFactory;
import com.hiliving.email.outbox.EmailOutboxService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PaymentStateService {
    private final PaymentAttemptRepository attempts;
    private final OrderRepository orders;
    private final ProductRepository products;
    private final QpayClient qpay;
    private final EmailOutboxService emailOutbox;
    private final OrderEmailPayloadFactory emailPayloads;
    private final AuditService audit;
    private final Clock clock;

    public PaymentStateService(PaymentAttemptRepository attempts, OrderRepository orders,
                               ProductRepository products, QpayClient qpay,
                               EmailOutboxService emailOutbox, OrderEmailPayloadFactory emailPayloads,
                               AuditService audit, Clock clock) {
        this.attempts = attempts;
        this.orders = orders;
        this.products = products;
        this.qpay = qpay;
        this.emailOutbox = emailOutbox;
        this.emailPayloads = emailPayloads;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional
    public Preparation prepare(Long orderId) {
        OrderEntity order = orders.findByIdForUpdate(orderId)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order was not found"));
        if (order.getPaymentMethod() != PaymentMethod.QPAY || order.getOrderStatus() != OrderStatus.PENDING_PAYMENT) {
            throw error(HttpStatus.CONFLICT, "ORDER_NOT_AWAITING_PAYMENT", "Order is not awaiting QPay payment");
        }
        PaymentAttemptEntity latest = attempts.findFirstByOrderIdOrderByAttemptNumberDesc(orderId).orElse(null);
        if (latest != null && (latest.getStatus() == PaymentAttemptStatus.AWAITING_PAYMENT
                || latest.getStatus() == PaymentAttemptStatus.PAID)) {
            return Preparation.existing(latest.getId());
        }
        int number = latest == null ? 1 : latest.getAttemptNumber() + 1;
        String callbackToken = UUID.randomUUID().toString();
        String senderInvoiceNo = order.getOrderNumber().replace("-", "") + "P" + number;
        PaymentAttemptEntity attempt = PaymentAttemptEntity.create(
                order, number, senderInvoiceNo, sha256(callbackToken), Instant.now(clock).plus(qpay.invoiceTtl())
        );
        attempts.saveAndFlush(attempt);
        return new Preparation(
                attempt.getId(), false, callbackToken, senderInvoiceNo, order.getOrderNumber(),
                String.valueOf(order.getCustomer().getId()), order.getGrandTotal()
        );
    }

    @Transactional
    public PaymentInstructionsResponse recordInvoice(Long attemptId, QpayClient.InvoiceResponse response) {
        PaymentAttemptEntity attempt = attempts.findByIdForUpdate(attemptId)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "PAYMENT_ATTEMPT_NOT_FOUND", "Payment attempt was not found"));
        attempt.recordInvoice(
                response.invoiceId(), response.qrText(), response.qrImage(), response.shortUrl(), response.urls()
        );
        return PaymentInstructionsResponse.from(attempt);
    }

    @Transactional
    public void recordFailure(Long attemptId, String code) {
        PaymentAttemptEntity attempt = attempts.findByIdForUpdate(attemptId)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "PAYMENT_ATTEMPT_NOT_FOUND", "Payment attempt was not found"));
        OrderEntity order = attempt.getOrder();
        if (attempt.getStatus() == PaymentAttemptStatus.FAILED && order.getInventoryReleasedAt() != null) return;
        if (attempt.getStatus() != PaymentAttemptStatus.CREATED) {
            throw new IllegalStateException("Only a newly created QPay attempt can fail before invoice creation");
        }
        restoreInventory(order);
        Instant releasedAt = Instant.now(clock);
        attempt.markFailed(code);
        order.failPaymentAndReleaseInventory(releasedAt);
        audit.record("QPAY_PAYMENT_FAILED", "ORDER", order.getId(), code + "; inventory restored");
    }

    @Transactional(readOnly = true)
    public PaymentInstructionsResponse instructions(Long attemptId) {
        return attempts.findById(attemptId).map(PaymentInstructionsResponse::from)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "PAYMENT_ATTEMPT_NOT_FOUND", "Payment attempt was not found"));
    }

    @Transactional(readOnly = true)
    public OwnedAttempt findOwned(String orderNumber, Long customerId) {
        OrderEntity order = orders.findByOrderNumberAndCustomerId(orderNumber, customerId)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order was not found"));
        PaymentAttemptEntity attempt = attempts.findFirstByOrderIdOrderByAttemptNumberDesc(order.getId())
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "PAYMENT_ATTEMPT_NOT_FOUND", "Payment attempt was not found"));
        return new OwnedAttempt(attempt.getId(), attempt.getProviderInvoiceId(), PaymentInstructionsResponse.from(attempt));
    }

    @Transactional(readOnly = true)
    public CallbackAttempt findCallback(String callbackToken) {
        PaymentAttemptEntity attempt = attempts.findByCallbackTokenHash(sha256(callbackToken))
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "PAYMENT_CALLBACK_NOT_FOUND", "Payment callback was not found"));
        return new CallbackAttempt(attempt.getId(), attempt.getProviderInvoiceId(), attempt.getStatus());
    }

    @Transactional(noRollbackFor = ApiRequestException.class)
    public PaymentInstructionsResponse confirmPaid(Long attemptId, QpayClient.PaymentRow row) {
        PaymentAttemptEntity attempt = attempts.findByIdForUpdate(attemptId)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "PAYMENT_ATTEMPT_NOT_FOUND", "Payment attempt was not found"));
        if (attempt.getStatus() == PaymentAttemptStatus.PAID) return PaymentInstructionsResponse.from(attempt);
        OrderEntity order = attempt.getOrder();
        if (order.getInventoryReleasedAt() != null || order.getOrderStatus() == OrderStatus.CANCELLED) {
            attempt.requireReconciliation("LATE_PAYMENT_REQUIRES_RECONCILIATION");
            throw error(HttpStatus.CONFLICT, "PAYMENT_RECONCILIATION_REQUIRED", "Payment arrived after inventory was released");
        }
        Instant paidAt = Instant.now(clock);
        attempt.recordPaid(row.paymentId(), paidAt);
        order.confirmPaid();
        emailOutbox.enqueue("order-confirmation:" + order.getOrderNumber(), EmailEventType.ORDER_CONFIRMATION,
                order.getCustomerEmailSnapshot(), "HiLiving захиалга баталгаажлаа — " + order.getOrderNumber(),
                "order-confirmation", emailPayloads.from(order));
        audit.record("QPAY_PAYMENT_CONFIRMED", "ORDER", order.getId(), "payment_id=" + row.paymentId());
        return PaymentInstructionsResponse.from(attempt);
    }

    @Transactional
    public void requireReconciliation(Long attemptId, String code) {
        PaymentAttemptEntity attempt = attempts.findByIdForUpdate(attemptId)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "PAYMENT_ATTEMPT_NOT_FOUND", "Payment attempt was not found"));
        if (attempt.getStatus() == PaymentAttemptStatus.RECONCILIATION_REQUIRED) return;
        attempt.requireReconciliation(code);
        audit.record("QPAY_PAYMENT_RECONCILIATION_REQUIRED", "ORDER", attempt.getOrder().getId(), code);
    }

    @Transactional
    public void expire(Long attemptId) {
        PaymentAttemptEntity attempt = attempts.findByIdForUpdate(attemptId)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "PAYMENT_ATTEMPT_NOT_FOUND", "Payment attempt was not found"));
        if (attempt.getStatus() == PaymentAttemptStatus.PAID || attempt.getStatus() == PaymentAttemptStatus.EXPIRED) return;
        OrderEntity order = attempt.getOrder();
        if (order.getPaymentStatus() == PaymentStatus.PAID || order.getInventoryReleasedAt() != null) return;
        restoreInventory(order);
        Instant releasedAt = Instant.now(clock);
        attempt.markExpired();
        order.expirePaymentAndReleaseInventory(releasedAt);
        audit.record("QPAY_PAYMENT_EXPIRED", "ORDER", order.getId(), "Inventory restored");
    }

    private void restoreInventory(OrderEntity order) {
        List<Long> productIds = order.getItems().stream().map(item -> item.getProduct().getId())
                .distinct().sorted().toList();
        Map<Long, ProductEntity> lockedProducts = products.findAllByIdForUpdate(productIds).stream()
                .collect(Collectors.toMap(ProductEntity::getId, Function.identity()));
        order.getItems().stream().sorted(Comparator.comparing(item -> item.getProduct().getId()))
                .forEach(item -> requireLockedProduct(lockedProducts, item.getProduct().getId())
                        .restoreStock(item.getQuantity()));
    }

    private ProductEntity requireLockedProduct(Map<Long, ProductEntity> lockedProducts, Long productId) {
        ProductEntity product = lockedProducts.get(productId);
        if (product == null) throw new IllegalStateException("Order product was not available for inventory restoration");
        return product;
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable", impossible);
        }
    }

    private ApiRequestException error(HttpStatus status, String code, String message) {
        return new ApiRequestException(status, code, message);
    }

    public record Preparation(Long attemptId, boolean existing, String callbackToken, String senderInvoiceNo,
                              String orderNumber, String customerCode, java.math.BigDecimal amount) {
        static Preparation existing(Long attemptId) {
            return new Preparation(attemptId, true, null, null, null, null, null);
        }
    }
    public record OwnedAttempt(Long attemptId, String invoiceId, PaymentInstructionsResponse instructions) {}
    public record CallbackAttempt(Long attemptId, String invoiceId, PaymentAttemptStatus status) {}
}
