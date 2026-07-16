package com.hiliving.identity.account.api;

import com.hiliving.identity.user.persistence.UserAddressEntity;

import java.time.Instant;

public record AddressResponse(
        Long id,
        String label,
        String cityOrProvince,
        String districtOrSoum,
        String khorooOrBag,
        String addressLine,
        String additionalDetails,
        String recipientName,
        String recipientPhone,
        boolean defaultAddress,
        Instant createdAt,
        Instant updatedAt
) {
    public static AddressResponse from(UserAddressEntity address) {
        return new AddressResponse(
                address.getId(), address.getLabel(), address.getCityOrProvince(), address.getDistrictOrSoum(),
                address.getKhorooOrBag(), address.getAddressLine(), address.getAdditionalDetails(),
                address.getRecipientName(), address.getRecipientPhone(), address.isDefaultAddress(),
                address.getCreatedAt(), address.getUpdatedAt()
        );
    }
}
