package com.hiliving.commerce.payment;

import com.hiliving.commerce.order.OrderEntity;
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
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "payment_attempts")
public class PaymentAttemptEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false) private OrderEntity order;
    @Column(nullable = false, length = 20) private String provider;
    @Column(name = "attempt_number", nullable = false) private int attemptNumber;
    @Column(name = "sender_invoice_no", nullable = false, length = 45) private String senderInvoiceNo;
    @Column(name = "provider_invoice_id", unique = true, length = 64) private String providerInvoiceId;
    @Column(name = "provider_payment_id", unique = true, length = 64) private String providerPaymentId;
    @Column(name = "callback_token_hash", nullable = false, unique = true, length = 64) private String callbackTokenHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32) private PaymentAttemptStatus status;
    @Column(nullable = false, precision = 14, scale = 2) private BigDecimal amount;
    @Column(nullable = false, length = 3) private String currency;
    @Column(name = "qr_text", columnDefinition = "text") private String qrText;
    @Column(name = "qr_image", columnDefinition = "text") private String qrImage;
    @Column(name = "short_url", length = 2048) private String shortUrl;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "paid_at") private Instant paidAt;
    @Column(name = "failure_code", length = 80) private String failureCode;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @OrderBy("displayOrder ASC, id ASC")
    @OneToMany(mappedBy = "paymentAttempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaymentDeeplinkEntity> deeplinks = new ArrayList<>();

    protected PaymentAttemptEntity() {}

    public static PaymentAttemptEntity create(OrderEntity order, int attemptNumber, String senderInvoiceNo,
                                              String callbackTokenHash, Instant expiresAt) {
        PaymentAttemptEntity attempt = new PaymentAttemptEntity();
        attempt.order = order;
        attempt.provider = "QPAY";
        attempt.attemptNumber = attemptNumber;
        attempt.senderInvoiceNo = senderInvoiceNo;
        attempt.callbackTokenHash = callbackTokenHash;
        attempt.status = PaymentAttemptStatus.CREATED;
        attempt.amount = order.getGrandTotal();
        attempt.currency = order.getCurrency();
        attempt.expiresAt = expiresAt;
        return attempt;
    }

    public void recordInvoice(String invoiceId, String qrText, String qrImage, String shortUrl,
                              List<QpayClient.Deeplink> returnedDeeplinks) {
        providerInvoiceId = invoiceId;
        this.qrText = qrText;
        this.qrImage = qrImage;
        this.shortUrl = shortUrl;
        failureCode = null;
        status = PaymentAttemptStatus.AWAITING_PAYMENT;
        deeplinks.clear();
        for (int index = 0; index < returnedDeeplinks.size(); index++) {
            QpayClient.Deeplink link = returnedDeeplinks.get(index);
            deeplinks.add(PaymentDeeplinkEntity.create(
                    this, index, link.name(), link.description(), link.logo(), link.link()
            ));
        }
    }

    public void recordPaid(String paymentId, Instant paidAt) {
        providerPaymentId = paymentId;
        this.paidAt = paidAt;
        failureCode = null;
        status = PaymentAttemptStatus.PAID;
    }

    public void markFailed(String code) {
        failureCode = code;
        status = PaymentAttemptStatus.FAILED;
    }

    public void requireReconciliation(String code) {
        failureCode = code;
        status = PaymentAttemptStatus.RECONCILIATION_REQUIRED;
    }

    public void markExpired() { status = PaymentAttemptStatus.EXPIRED; }

    @PrePersist void onCreate() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }

    public Long getId() { return id; }
    public OrderEntity getOrder() { return order; }
    public int getAttemptNumber() { return attemptNumber; }
    public String getSenderInvoiceNo() { return senderInvoiceNo; }
    public String getProviderInvoiceId() { return providerInvoiceId; }
    public String getProviderPaymentId() { return providerPaymentId; }
    public PaymentAttemptStatus getStatus() { return status; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public String getQrText() { return qrText; }
    public String getQrImage() { return qrImage; }
    public String getShortUrl() { return shortUrl; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getPaidAt() { return paidAt; }
    public String getFailureCode() { return failureCode; }
    public List<PaymentDeeplinkEntity> getDeeplinks() { return Collections.unmodifiableList(deeplinks); }
}
