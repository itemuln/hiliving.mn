package com.hiliving.commerce.order;

import com.hiliving.identity.user.persistence.UserAddressEntity;
import com.hiliving.identity.user.persistence.UserEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "order_address_snapshots")
public class OrderAddressSnapshotEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_id", nullable = false, unique = true)
    private OrderEntity order;
    @Column(nullable = false, length = 80) private String label;
    @Column(name = "city_or_province", nullable = false, length = 120) private String cityOrProvince;
    @Column(name = "district_or_soum", nullable = false, length = 120) private String districtOrSoum;
    @Column(name = "khoroo_or_bag", length = 120) private String khorooOrBag;
    @Column(name = "address_line", nullable = false, length = 300) private String addressLine;
    @Column(name = "additional_details", length = 500) private String additionalDetails;
    @Column(name = "recipient_name", nullable = false, length = 200) private String recipientName;
    @Column(name = "recipient_phone", nullable = false, length = 16) private String recipientPhone;

    protected OrderAddressSnapshotEntity() {}

    static OrderAddressSnapshotEntity delivery(OrderEntity order, UserAddressEntity address) {
        if (address == null) {
            throw new IllegalStateException("Standard delivery requires an address snapshot");
        }
        OrderAddressSnapshotEntity snapshot = new OrderAddressSnapshotEntity();
        snapshot.order = order;
        snapshot.label = address.getLabel();
        snapshot.cityOrProvince = address.getCityOrProvince();
        snapshot.districtOrSoum = address.getDistrictOrSoum();
        snapshot.khorooOrBag = address.getKhorooOrBag();
        snapshot.addressLine = address.getAddressLine();
        snapshot.additionalDetails = address.getAdditionalDetails();
        snapshot.recipientName = address.getRecipientName();
        snapshot.recipientPhone = address.getRecipientPhone();
        return snapshot;
    }

    static OrderAddressSnapshotEntity pickup(OrderEntity order, UserEntity customer) {
        OrderAddressSnapshotEntity snapshot = new OrderAddressSnapshotEntity();
        snapshot.order = order;
        snapshot.label = "Өөрөө авах — туршилтын байршил";
        snapshot.cityOrProvince = "Улаанбаатар";
        snapshot.districtOrSoum = "Хан-Уул дүүрэг";
        snapshot.khorooOrBag = "17-р хороо";
        snapshot.addressLine = "Зайсангийн гүүрний урд, Hiliving Mongolia төв оффис";
        snapshot.additionalDetails = "Даваа–Бямба 10:00–20:00 · Ням амарна · Утас: 7755-8888";
        snapshot.recipientName = (customer.getFirstName() + " " + customer.getLastName()).trim();
        snapshot.recipientPhone = customer.getPhoneNumber();
        return snapshot;
    }

    public String getLabel() { return label; }
    public String getCityOrProvince() { return cityOrProvince; }
    public String getDistrictOrSoum() { return districtOrSoum; }
    public String getKhorooOrBag() { return khorooOrBag; }
    public String getAddressLine() { return addressLine; }
    public String getAdditionalDetails() { return additionalDetails; }
    public String getRecipientName() { return recipientName; }
    public String getRecipientPhone() { return recipientPhone; }
}
