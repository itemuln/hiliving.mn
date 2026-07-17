package com.hiliving.commerce.cart;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CartItemRequest(
        @NotBlank @Size(max = 260) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$") String productSlug,
        @Min(1) @Max(99) int quantity
) {
}
