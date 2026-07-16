package com.hiliving.catalog.brand.admin;

import jakarta.validation.constraints.*;

public record AdminBrandRequest(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Size(max = 160) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$") String slug,
        @Size(max = 2048) String logoUrl,
        @Size(max = 1000) String description,
        @Min(0) int sortOrder,
        boolean active
) {}
