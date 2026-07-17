package com.hiliving.commerce.order;

import com.hiliving.api.error.ApiRequestException;
import com.hiliving.catalog.product.persistence.ProductEntity;
import com.hiliving.catalog.product.persistence.ProductRepository;
import com.hiliving.commerce.cart.CartQuoteResponse;
import com.hiliving.commerce.pricing.PricingService;
import com.hiliving.identity.user.persistence.UserAddressEntity;
import com.hiliving.identity.user.persistence.UserAddressRepository;
import com.hiliving.identity.user.persistence.UserEntity;
import com.hiliving.identity.user.persistence.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

@Service
public class OrderService {
    private final OrderRepository orders;
    private final UserRepository users;
    private final UserAddressRepository addresses;
    private final ProductRepository products;
    private final PricingService pricing;

    public OrderService(OrderRepository orders, UserRepository users, UserAddressRepository addresses,
                        ProductRepository products, PricingService pricing) {
        this.orders = orders;
        this.users = users;
        this.addresses = addresses;
        this.products = products;
        this.pricing = pricing;
    }

    @Transactional
    public OrderResponse place(Long customerId, String idempotencyKeyValue, PlaceOrderRequest request) {
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
            return OrderResponse.from(existing);
        }

        UserAddressEntity address = addresses.findByIdAndUserId(request.addressId(), customerId)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "ADDRESS_NOT_FOUND", "Address was not found"));

        List<Long> productIds = products.findIdsBySlugIn(
                request.items().stream().map(item -> item.productSlug()).distinct().toList());
        List<ProductEntity> lockedProducts = products.findAllByIdForUpdate(productIds);
        Map<String, ProductEntity> lockedBySlug = new HashMap<>();
        lockedProducts.forEach(product -> lockedBySlug.put(product.getSlug(), product));

        CartQuoteResponse quote = pricing.quote(request.items(), customer);
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
        return OrderResponse.from(orders.saveAndFlush(order));
    }

    @Transactional(readOnly = true)
    public OrderResponse findOwn(Long customerId, String orderNumber) {
        return orders.findByOrderNumberAndCustomerId(orderNumber, customerId)
                .map(OrderResponse::from)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order was not found"));
    }

    private DeliveryMethod parseDeliveryMethod(String value) {
        if (!DeliveryMethod.STANDARD_DELIVERY.name().equals(value)) {
            throw error(HttpStatus.BAD_REQUEST, "UNSUPPORTED_DELIVERY_METHOD", "Delivery method is not supported");
        }
        return DeliveryMethod.STANDARD_DELIVERY;
    }

    private PaymentMethod parsePaymentMethod(String value) {
        if (!PaymentMethod.CASH_ON_DELIVERY.name().equals(value)) {
            throw error(HttpStatus.BAD_REQUEST, "UNSUPPORTED_PAYMENT_METHOD", "Payment method is not supported");
        }
        return PaymentMethod.CASH_ON_DELIVERY;
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
}
