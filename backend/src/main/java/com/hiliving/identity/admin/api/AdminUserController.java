package com.hiliving.identity.admin.api;

import com.hiliving.api.ApiResponse;
import com.hiliving.api.PagedResponse;
import com.hiliving.identity.account.api.AccountResponse;
import com.hiliving.identity.admin.application.AdminUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {
    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) { this.adminUserService = adminUserService; }

    @GetMapping
    public ApiResponse<PagedResponse<AccountResponse>> search(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) @Size(max = 100) String search,
            @RequestParam(defaultValue = "newest") String sort
    ) { return ApiResponse.of(adminUserService.search(page, size, search, sort)); }

    @GetMapping("/{userId}")
    public ApiResponse<AccountResponse> find(@PathVariable @Min(1) Long userId) {
        return ApiResponse.of(adminUserService.find(userId));
    }

    @PatchMapping("/{userId}/status")
    public ApiResponse<AccountResponse> updateStatus(@PathVariable @Min(1) Long userId, @Valid @RequestBody UpdateStatusRequest request) {
        return ApiResponse.of(adminUserService.updateStatus(userId, request.status()));
    }

    @PatchMapping("/{userId}/membership")
    public ApiResponse<AccountResponse> updateMembership(@PathVariable @Min(1) Long userId, @Valid @RequestBody UpdateMembershipRequest request) {
        return ApiResponse.of(adminUserService.updateMembership(userId, request.membershipCode()));
    }

    @PatchMapping("/{userId}/discount")
    public ApiResponse<AccountResponse> updateDiscount(@PathVariable @Min(1) Long userId, @Valid @RequestBody UpdateDiscountRequest request) {
        return ApiResponse.of(adminUserService.updateDiscount(userId, request.discountOverridePercentage()));
    }
}
