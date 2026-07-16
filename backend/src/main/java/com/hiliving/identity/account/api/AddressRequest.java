package com.hiliving.identity.account.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddressRequest(
        @NotBlank @Size(max = 80) String label,
        @NotBlank @Size(max = 120) String cityOrProvince,
        @NotBlank @Size(max = 120) String districtOrSoum,
        @Size(max = 120) String khorooOrBag,
        @NotBlank @Size(max = 300) String addressLine,
        @Size(max = 500) String additionalDetails,
        @NotBlank @Size(max = 200) String recipientName,
        @NotBlank @Size(max = 30) String recipientPhone,
        boolean defaultAddress
) {}
