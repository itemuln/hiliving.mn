package com.hiliving.commerce.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateOrderStatusRequest(@NotBlank @Size(max = 32) String status) {}
