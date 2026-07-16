package com.hiliving.identity.admin.api;

import jakarta.validation.constraints.NotBlank;

public record UpdateMembershipRequest(@NotBlank String membershipCode) {}
