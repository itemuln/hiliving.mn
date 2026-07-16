package com.hiliving.identity.account.api;

import com.hiliving.api.ApiResponse;
import com.hiliving.identity.account.application.AccountService;
import com.hiliving.identity.auth.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/account")
public class AccountController {
    private final AccountService accountService;

    public AccountController(AccountService accountService) { this.accountService = accountService; }

    @GetMapping("/me")
    public ApiResponse<AccountResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.of(accountService.current(principal.id()));
    }

    @PatchMapping("/profile")
    public ApiResponse<AccountResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ApiResponse.of(accountService.updateProfile(principal.id(), request));
    }

    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        accountService.changePassword(principal.id(), request);
    }
}
