package com.hiliving.identity.auth.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetConfirmRequest(
        @NotBlank @Size(max = 200) String token,
        @NotBlank @Size(max = 128) String newPassword,
        @NotBlank @Size(max = 128) String confirmPassword
) {}
