package com.hiliving.identity.account.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Size(max = 254) String email,
        @NotBlank @Size(max = 30) String phoneNumber,
        String currentPassword
) {}
