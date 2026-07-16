package com.hiliving.identity.user.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "user_addresses")
public class UserAddressEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false, length = 80)
    private String label;
    @Column(name = "city_or_province", nullable = false, length = 120)
    private String cityOrProvince;
    @Column(name = "district_or_soum", nullable = false, length = 120)
    private String districtOrSoum;
    @Column(name = "khoroo_or_bag", length = 120)
    private String khorooOrBag;
    @Column(name = "address_line", nullable = false, length = 300)
    private String addressLine;
    @Column(name = "additional_details", length = 500)
    private String additionalDetails;
    @Column(name = "recipient_name", nullable = false, length = 200)
    private String recipientName;
    @Column(name = "recipient_phone", nullable = false, length = 16)
    private String recipientPhone;
    @Column(name = "is_default", nullable = false)
    private boolean defaultAddress;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserAddressEntity() {}

    public static UserAddressEntity create(UserEntity user) {
        UserAddressEntity address = new UserAddressEntity();
        address.user = user;
        return address;
    }

    public void update(
            String label, String cityOrProvince, String districtOrSoum, String khorooOrBag,
            String addressLine, String additionalDetails, String recipientName,
            String recipientPhone, boolean defaultAddress
    ) {
        this.label = label;
        this.cityOrProvince = cityOrProvince;
        this.districtOrSoum = districtOrSoum;
        this.khorooOrBag = khorooOrBag;
        this.addressLine = addressLine;
        this.additionalDetails = additionalDetails;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.defaultAddress = defaultAddress;
    }

    public void clearDefault() { defaultAddress = false; }

    @PrePersist void onCreate() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }

    public Long getId() { return id; }
    public UserEntity getUser() { return user; }
    public String getLabel() { return label; }
    public String getCityOrProvince() { return cityOrProvince; }
    public String getDistrictOrSoum() { return districtOrSoum; }
    public String getKhorooOrBag() { return khorooOrBag; }
    public String getAddressLine() { return addressLine; }
    public String getAdditionalDetails() { return additionalDetails; }
    public String getRecipientName() { return recipientName; }
    public String getRecipientPhone() { return recipientPhone; }
    public boolean isDefaultAddress() { return defaultAddress; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
