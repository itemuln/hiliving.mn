package com.hiliving.identity.auth.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Size(max = 30) String phoneNumber,
        @NotBlank @Size(max = 254) String email,
        @NotBlank String password
) {}
