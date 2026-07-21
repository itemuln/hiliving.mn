package com.hiliving.identity.auth.api;

import com.hiliving.api.ApiResponse;
import com.hiliving.identity.auth.application.EmailVerificationService;
import com.hiliving.identity.auth.application.PasswordRecoveryService;
import com.hiliving.identity.auth.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AccountRecoveryController {
    private final EmailVerificationService verification;
    private final PasswordRecoveryService passwordRecovery;

    public AccountRecoveryController(EmailVerificationService verification, PasswordRecoveryService passwordRecovery) {
        this.verification = verification;
        this.passwordRecovery = passwordRecovery;
    }

    @PostMapping("/email-verification/request")
    public ApiResponse<MessageResponse> requestVerification(@AuthenticationPrincipal UserPrincipal principal,
                                                            HttpServletRequest request) {
        verification.request(principal.id(), clientIp(request));
        return ApiResponse.of(new MessageResponse(EmailVerificationService.REQUEST_MESSAGE));
    }

    @PostMapping("/email-verification/confirm")
    public ApiResponse<MessageResponse> confirmVerification(@Valid @RequestBody EmailVerificationConfirmRequest request) {
        verification.confirm(request.token());
        return ApiResponse.of(new MessageResponse(EmailVerificationService.CONFIRMED_MESSAGE));
    }

    @PostMapping("/password-reset/request")
    public ApiResponse<MessageResponse> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request,
                                                             HttpServletRequest servletRequest) {
        passwordRecovery.request(request.email(), clientIp(servletRequest));
        return ApiResponse.of(new MessageResponse(PasswordRecoveryService.REQUEST_MESSAGE));
    }

    @PostMapping("/password-reset/confirm")
    public ApiResponse<MessageResponse> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request,
                                                             HttpServletRequest servletRequest) {
        passwordRecovery.confirm(request, clientIp(servletRequest));
        return ApiResponse.of(new MessageResponse(PasswordRecoveryService.CONFIRMED_MESSAGE));
    }

    private String clientIp(HttpServletRequest request) {
        String address = request.getRemoteAddr();
        if (address == null || address.isBlank()) return "unknown";
        int scope = address.indexOf('%');
        String normalized = scope >= 0 ? address.substring(0, scope) : address;
        return normalized.substring(0, Math.min(normalized.length(), 45));
    }
}
