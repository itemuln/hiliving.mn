package com.hiliving.commerce.cart;

import com.hiliving.api.ApiResponse;
import com.hiliving.commerce.pricing.PricingService;
import com.hiliving.identity.auth.security.UserPrincipal;
import com.hiliving.identity.user.persistence.UserEntity;
import com.hiliving.identity.user.persistence.UserRepository;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cart")
public class CartQuoteController {
    private final PricingService pricing;
    private final UserRepository users;

    public CartQuoteController(PricingService pricing, UserRepository users) {
        this.pricing = pricing;
        this.users = users;
    }

    @PostMapping("/quote")
    public ApiResponse<CartQuoteResponse> quote(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CartQuoteRequest request
    ) {
        UserEntity customer = principal == null ? null : users.findById(principal.id()).orElse(null);
        return ApiResponse.of(pricing.quote(request.items(), customer));
    }
}
