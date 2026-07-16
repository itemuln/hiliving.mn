package com.hiliving.identity.account.api;

import com.hiliving.api.ApiResponse;
import com.hiliving.identity.account.application.AddressService;
import com.hiliving.identity.auth.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/account/addresses")
public class AddressController {
    private final AddressService addressService;

    public AddressController(AddressService addressService) { this.addressService = addressService; }

    @GetMapping
    public ApiResponse<List<AddressResponse>> findAll(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.of(addressService.findAll(principal.id()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AddressResponse> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AddressRequest request
    ) { return ApiResponse.of(addressService.create(principal.id(), request)); }

    @PatchMapping("/{addressId}")
    public ApiResponse<AddressResponse> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable @Min(1) Long addressId,
            @Valid @RequestBody AddressRequest request
    ) { return ApiResponse.of(addressService.update(principal.id(), addressId, request)); }

    @DeleteMapping("/{addressId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable @Min(1) Long addressId
    ) { addressService.delete(principal.id(), addressId); }
}
