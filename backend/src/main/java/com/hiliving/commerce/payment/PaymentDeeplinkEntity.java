package com.hiliving.commerce.payment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "payment_deeplinks")
public class PaymentDeeplinkEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_attempt_id", nullable = false) private PaymentAttemptEntity paymentAttempt;
    @Column(name = "display_order", nullable = false) private int displayOrder;
    @Column(nullable = false, length = 100) private String name;
    @Column(nullable = false, length = 120) private String description;
    @Column(name = "logo_url", nullable = false, length = 2048) private String logoUrl;
    @Column(nullable = false, length = 4096) private String link;

    protected PaymentDeeplinkEntity() {}

    static PaymentDeeplinkEntity create(PaymentAttemptEntity attempt, int displayOrder,
                                        String name, String description, String logoUrl, String link) {
        PaymentDeeplinkEntity deeplink = new PaymentDeeplinkEntity();
        deeplink.paymentAttempt = attempt;
        deeplink.displayOrder = displayOrder;
        deeplink.name = name;
        deeplink.description = description;
        deeplink.logoUrl = logoUrl;
        deeplink.link = link;
        return deeplink;
    }

    public int getDisplayOrder() { return displayOrder; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getLogoUrl() { return logoUrl; }
    public String getLink() { return link; }
}
