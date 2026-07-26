package com.hiliving.commerce.order;

import com.hiliving.api.error.ApiRequestException;
import com.hiliving.api.PagedResponse;
import com.hiliving.admin.audit.AuditService;
import com.hiliving.catalog.product.persistence.ProductEntity;
import com.hiliving.catalog.product.persistence.ProductRepository;
import com.hiliving.commerce.cart.CartQuoteResponse;
import com.hiliving.commerce.pricing.PricingService;
import com.hiliving.email.EmailEventType;
import com.hiliving.email.OrderEmailPayloadFactory;
import com.hiliving.email.outbox.EmailOutboxService;
import com.hiliving.identity.user.persistence.UserAddressEntity;
import com.hiliving.identity.user.persistence.UserAddressRepository;
import com.hiliving.identity.user.persistence.UserEntity;
import com.hiliving.identity.user.persistence.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.Set;

@Service
public class OrderService {
    private final OrderRepository orders;
    private final UserRepository users;
    private final UserAddressRepository addresses;
    private final ProductRepository products;
    private final PricingService pricing;
    private final EmailOutboxService emailOutbox;
    private final OrderEmailPayloadFactory emailPayloads;
    private final AuditService audit;

    public OrderService(OrderRepository orders, UserRepository users, UserAddressRepository addresses,
                        ProductRepository products, PricingService pricing, EmailOutboxService emailOutbox,
                        OrderEmailPayloadFactory emailPayloads, AuditService audit) {
        this.orders = orders;
        this.users = users;
        this.addresses = addresses;
        this.products = products;
        this.pricing = pricing;
        this.emailOutbox = emailOutbox;
        this.emailPayloads = emailPayloads;
        this.audit = audit;
    }

    @Transactional
    public OrderPlacement place(Long customerId, String idempotencyKeyValue, PlaceOrderRequest request) {
        UUID idempotencyKey = parseIdempotencyKey(idempotencyKeyValue);
        DeliveryMethod deliveryMethod = parseDeliveryMethod(request.deliveryMethod());
        PaymentMethod paymentMethod = parsePaymentMethod(request.paymentMethod());
        String note = trimNullable(request.customerNote());
        String requestHash = requestHash(request, deliveryMethod, paymentMethod, note);

        UserEntity customer = users.findByIdForUpdate(customerId)
                .orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "CHECKOUT_REQUIRES_AUTHENTICATION", "Customer was not found"));
        OrderEntity existing = orders.findByCustomerIdAndIdempotencyKey(customerId, idempotencyKey).orElse(null);
        if (existing != null) {
            if (!existing.getRequestHash().equals(requestHash)) {
                throw error(HttpStatus.CONFLICT, "DUPLICATE_ORDER_SUBMISSION", "Idempotency key was already used for a different order");
            }
            return new OrderPlacement(existing.getId(), OrderResponse.from(existing));
        }

        UserAddressEntity address = resolveAddress(request.addressId(), customerId, deliveryMethod);

        List<Long> productIds = products.findIdsBySlugIn(
                request.items().stream().map(item -> item.productSlug()).distinct().toList());
        List<ProductEntity> lockedProducts = products.findAllByIdForUpdate(productIds);
        Map<String, ProductEntity> lockedBySlug = new HashMap<>();
        lockedProducts.forEach(product -> lockedBySlug.put(product.getSlug(), product));

        CartQuoteResponse quote = pricing.quote(request.items(), customer, deliveryMethod);
        for (var line : quote.items()) {
            ProductEntity product = lockedBySlug.get(line.productSlug());
            if (product == null) {
                throw error(HttpStatus.CONFLICT, "INVENTORY_CHANGED", "Product availability changed during checkout");
            }
            pricing.validatePurchasable(product, line.requestedQuantity());
            product.deductStock(line.requestedQuantity());
        }

        OrderEntity order = OrderEntity.create(
                nextOrderNumber(), customer, idempotencyKey, requestHash, paymentMethod, deliveryMethod,
                note, quote, address, lockedBySlug
        );
        OrderEntity saved = orders.saveAndFlush(order);
        if (paymentMethod == PaymentMethod.CASH_ON_DELIVERY) {
            emailOutbox.enqueue("order-confirmation:" + saved.getOrderNumber(), EmailEventType.ORDER_CONFIRMATION,
                    saved.getCustomerEmailSnapshot(), "HiLiving захиалга баталгаажлаа — " + saved.getOrderNumber(),
                    "order-confirmation", emailPayloads.from(saved));
        }
        return new OrderPlacement(saved.getId(), OrderResponse.from(saved));
    }

    @Transactional(readOnly = true)
    public PagedResponse<OrderSummaryResponse> listOwn(Long customerId, int page, int size) {
        var result = orders.findByCustomerIdOrderByPlacedAtDescIdDesc(customerId, PageRequest.of(page, size));
        return new PagedResponse<>(result.getContent().stream().map(OrderSummaryResponse::from).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(),
                result.isFirst(), result.isLast());
    }

    @Transactional(readOnly = true)
    public PagedResponse<AdminOrderSummaryResponse> listAdmin(int page, int size, String search,
                                                              OrderStatus orderStatus, PaymentStatus paymentStatus) {
        String normalizedSearch = search == null ? "" : search.trim();
        var result = orders.findAdminPage(normalizedSearch, orderStatus, paymentStatus, PageRequest.of(page, size));
        return new PagedResponse<>(result.getContent().stream().map(AdminOrderSummaryResponse::from).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(),
                result.isFirst(), result.isLast());
    }

    @Transactional(readOnly = true)
    public AdminOrderDetailResponse findAdmin(String orderNumber) {
        return orders.findByOrderNumber(orderNumber).map(AdminOrderDetailResponse::from)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order was not found"));
    }

    @Transactional(readOnly = true)
    public OrderResponse findOwn(Long customerId, String orderNumber) {
        return orders.findByOrderNumberAndCustomerId(orderNumber, customerId)
                .map(OrderResponse::from)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order was not found"));
    }

    @Transactional
    public OrderResponse updateStatus(String orderNumber, String statusValue) {
        OrderStatus requested;
        try {
            requested = OrderStatus.valueOf(statusValue);
        } catch (RuntimeException exception) {
            throw error(HttpStatus.BAD_REQUEST, "ORDER_STATUS_INVALID", "Order status is not supported");
        }
        OrderEntity order = orders.findByOrderNumberForUpdate(orderNumber)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order was not found"));
        OrderStatus previous = order.getOrderStatus();
        if (previous == requested) return OrderResponse.from(order);
        if (!allowedNext(order).contains(requested)) {
            throw error(HttpStatus.CONFLICT, "ORDER_STATUS_TRANSITION_INVALID", "Order status transition is not allowed");
        }
        order.changeStatus(requested);
        orders.flush();
        emailOutbox.enqueue("order-status:" + order.getOrderNumber() + ":" + requested.name(),
                EmailEventType.ORDER_STATUS_CHANGED, order.getCustomerEmailSnapshot(),
                "HiLiving захиалгын төлөв шинэчлэгдлээ — " + order.getOrderNumber(),
                "order-status-changed", emailPayloads.from(order));
        audit.record("ORDER_STATUS_CHANGED", "ORDER", order.getId(), previous.name() + " -> " + requested.name());
        return OrderResponse.from(order);
    }

    private Set<OrderStatus> allowedNext(OrderEntity order) {
        return switch (order.getOrderStatus()) {
            case PENDING_PAYMENT -> Set.of();
            case PENDING_CONFIRMATION -> Set.of(OrderStatus.CONFIRMED);
            case CONFIRMED -> Set.of(OrderStatus.PROCESSING);
            case PROCESSING -> order.getDeliveryMethod() == DeliveryMethod.SELF_PICKUP
                    ? Set.of(OrderStatus.DELIVERED)
                    : Set.of(OrderStatus.SHIPPED);
            case SHIPPED -> Set.of(OrderStatus.DELIVERED);
            case DELIVERED, CANCELLED -> Set.of();
        };
    }

    private DeliveryMethod parseDeliveryMethod(String value) {
        try {
            return DeliveryMethod.valueOf(value);
        } catch (RuntimeException exception) {
            throw error(HttpStatus.BAD_REQUEST, "UNSUPPORTED_DELIVERY_METHOD", "Delivery method is not supported");
        }
    }

    private UserAddressEntity resolveAddress(Long addressId, Long customerId, DeliveryMethod deliveryMethod) {
        if (deliveryMethod == DeliveryMethod.SELF_PICKUP) {
            if (addressId != null) {
                throw error(HttpStatus.BAD_REQUEST, "PICKUP_ADDRESS_NOT_ALLOWED", "Pickup orders must not include a delivery address");
            }
            return null;
        }
        if (addressId == null) {
            throw error(HttpStatus.BAD_REQUEST, "DELIVERY_ADDRESS_REQUIRED", "Delivery address is required");
        }
        return addresses.findByIdAndUserId(addressId, customerId)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "ADDRESS_NOT_FOUND", "Address was not found"));
    }

    private PaymentMethod parsePaymentMethod(String value) {
        try {
            return PaymentMethod.valueOf(value);
        } catch (RuntimeException exception) {
            throw error(HttpStatus.BAD_REQUEST, "UNSUPPORTED_PAYMENT_METHOD", "Payment method is not supported");
        }
    }

    private UUID parseIdempotencyKey(String value) {
        try {
            return UUID.fromString(value);
        } catch (RuntimeException exception) {
            throw error(HttpStatus.BAD_REQUEST, "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must be a UUID");
        }
    }

    private String requestHash(PlaceOrderRequest request, DeliveryMethod deliveryMethod,
                               PaymentMethod paymentMethod, String note) {
        String items = request.items().stream()
                .sorted(Comparator.comparing(item -> item.productSlug()))
                .map(item -> item.productSlug() + ":" + item.quantity())
                .reduce((left, right) -> left + "," + right).orElse("");
        String canonical = request.addressId() + "|" + deliveryMethod + "|" + paymentMethod + "|"
                + (note == null ? "" : note) + "|" + items;
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(canonical.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable", impossible);
        }
    }

    private String nextOrderNumber() {
        String date = LocalDate.now(ZoneOffset.UTC).format(DateTimeFormatter.BASIC_ISO_DATE);
        String random = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
        return "HL-" + date + "-" + random;
    }

    private String trimNullable(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ApiRequestException error(HttpStatus status, String code, String message) {
        return new ApiRequestException(status, code, message);
    }

    public record OrderPlacement(Long orderId, OrderResponse order) {}
}
