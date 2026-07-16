package com.hiliving.catalog.category.admin;

import jakarta.validation.constraints.*;

public record AdminCategoryRequest(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Size(max = 160) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$") String slug,
        @Positive Long parentId,
        @Size(max = 1000) String description,
        @Min(0) int sortOrder,
        boolean active
) {}
