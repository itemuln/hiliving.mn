package com.hiliving.commerce.cart;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CartQuoteRequest(
        @NotEmpty @Size(max = 50) List<@Valid CartItemRequest> items
) {
}
