package com.hiliving.commerce.order;

import com.hiliving.catalog.product.persistence.ProductEntity;
import com.hiliving.commerce.cart.CartLineResponse;
import com.hiliving.commerce.cart.CartQuoteResponse;
import com.hiliving.identity.user.persistence.UserAddressEntity;
import com.hiliving.identity.user.persistence.UserEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "orders")
public class OrderEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "order_number", nullable = false, unique = true, length = 32) private String orderNumber;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "customer_id", nullable = false) private UserEntity customer;
    @Column(name = "idempotency_key", nullable = false) private UUID idempotencyKey;
    @Column(name = "request_hash", nullable = false, length = 64) private String requestHash;
    @Column(name = "customer_email_snapshot", nullable = false, length = 254) private String customerEmailSnapshot;
    @Column(name = "customer_first_name_snapshot", nullable = false, length = 100) private String customerFirstNameSnapshot;
    @Enumerated(EnumType.STRING) @Column(name = "order_status", nullable = false, length = 32) private OrderStatus orderStatus;
    @Enumerated(EnumType.STRING) @Column(name = "payment_status", nullable = false, length = 20) private PaymentStatus paymentStatus;
    @Enumerated(EnumType.STRING) @Column(name = "payment_method", nullable = false, length = 32) private PaymentMethod paymentMethod;
    @Enumerated(EnumType.STRING) @Column(name = "delivery_method", nullable = false, length = 32) private DeliveryMethod deliveryMethod;
    @Column(nullable = false, length = 3) private String currency;
    @Column(name = "regular_subtotal", nullable = false, precision = 14, scale = 2) private BigDecimal regularSubtotal;
    @Column(name = "discount_total", nullable = false, precision = 14, scale = 2) private BigDecimal discountTotal;
    @Column(name = "effective_subtotal", nullable = false, precision = 14, scale = 2) private BigDecimal effectiveSubtotal;
    @Column(name = "shipping_total", nullable = false, precision = 14, scale = 2) private BigDecimal shippingTotal;
    @Column(name = "grand_total", nullable = false, precision = 14, scale = 2) private BigDecimal grandTotal;
    @Column(name = "customer_note", length = 500) private String customerNote;
    @Column(name = "placed_at", nullable = false) private Instant placedAt;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true) private List<OrderItemEntity> items = new ArrayList<>();
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, optional = false) private OrderAddressSnapshotEntity addressSnapshot;

    protected OrderEntity() {}

    static OrderEntity create(String orderNumber, UserEntity customer, UUID idempotencyKey, String requestHash,
                              PaymentMethod paymentMethod, DeliveryMethod deliveryMethod, String customerNote,
                              CartQuoteResponse quote, UserAddressEntity address, Map<String, ProductEntity> products) {
        OrderEntity order = new OrderEntity();
        order.orderNumber = orderNumber;
        order.customer = customer;
        order.idempotencyKey = idempotencyKey;
        order.requestHash = requestHash;
        order.customerEmailSnapshot = customer.getEmail();
        order.customerFirstNameSnapshot = customer.getFirstName();
        order.orderStatus = OrderStatus.PENDING_CONFIRMATION;
        order.paymentStatus = PaymentStatus.UNPAID;
        order.paymentMethod = paymentMethod;
        order.deliveryMethod = deliveryMethod;
        order.currency = quote.currency();
        order.regularSubtotal = quote.regularSubtotal();
        order.discountTotal = quote.discountTotal();
        order.effectiveSubtotal = quote.effectiveSubtotal();
        order.shippingTotal = quote.shippingAmount();
        order.grandTotal = quote.grandTotal();
        order.customerNote = customerNote;
        order.placedAt = Instant.now();
        for (CartLineResponse line : quote.items()) {
            order.items.add(OrderItemEntity.snapshot(order, products.get(line.productSlug()), line));
        }
        order.addressSnapshot = OrderAddressSnapshotEntity.snapshot(order, address);
        return order;
    }

    @PrePersist void onCreate() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }

    public Long getId() { return id; }
    public String getOrderNumber() { return orderNumber; }
    public UserEntity getCustomer() { return customer; }
    public UUID getIdempotencyKey() { return idempotencyKey; }
    public String getRequestHash() { return requestHash; }
    public String getCustomerEmailSnapshot() { return customerEmailSnapshot; }
    public String getCustomerFirstNameSnapshot() { return customerFirstNameSnapshot; }
    public OrderStatus getOrderStatus() { return orderStatus; }
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public DeliveryMethod getDeliveryMethod() { return deliveryMethod; }
    public String getCurrency() { return currency; }
    public BigDecimal getRegularSubtotal() { return regularSubtotal; }
    public BigDecimal getDiscountTotal() { return discountTotal; }
    public BigDecimal getEffectiveSubtotal() { return effectiveSubtotal; }
    public BigDecimal getShippingTotal() { return shippingTotal; }
    public BigDecimal getGrandTotal() { return grandTotal; }
    public String getCustomerNote() { return customerNote; }
    public Instant getPlacedAt() { return placedAt; }
    public List<OrderItemEntity> getItems() { return Collections.unmodifiableList(items); }
    public OrderAddressSnapshotEntity getAddressSnapshot() { return addressSnapshot; }
    public void changeStatus(OrderStatus status) { this.orderStatus = status; }
}
