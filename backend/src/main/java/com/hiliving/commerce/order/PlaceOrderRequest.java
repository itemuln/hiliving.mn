package com.hiliving.commerce.order;

import com.hiliving.commerce.cart.CartItemRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PlaceOrderRequest(
        @NotEmpty @Size(max = 50) List<@Valid CartItemRequest> items,
        @NotNull @Min(1) Long addressId,
        @NotBlank @Size(max = 32) String deliveryMethod,
        @NotBlank @Size(max = 32) String paymentMethod,
        @Size(max = 500) String customerNote
) {
}
