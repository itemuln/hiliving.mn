package com.hiliving.identity.account.application;

import com.hiliving.api.error.ApiRequestException;
import com.hiliving.identity.account.api.AccountResponse;
import com.hiliving.identity.account.api.ChangePasswordRequest;
import com.hiliving.identity.account.api.UpdateProfileRequest;
import com.hiliving.identity.auth.application.PasswordPolicy;
import com.hiliving.identity.user.application.IdentityNormalizer;
import com.hiliving.identity.user.persistence.UserEntity;
import com.hiliving.identity.user.persistence.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {
    private final UserRepository users;
    private final IdentityNormalizer normalizer;
    private final PasswordPolicy passwordPolicy;
    private final PasswordEncoder passwordEncoder;

    public AccountService(UserRepository users, IdentityNormalizer normalizer, PasswordPolicy passwordPolicy, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.normalizer = normalizer;
        this.passwordPolicy = passwordPolicy;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public AccountResponse current(Long userId) { return AccountResponse.from(required(userId)); }

    @Transactional
    public AccountResponse updateProfile(Long userId, UpdateProfileRequest request) {
        UserEntity user = required(userId);
        String email = normalizer.email(request.email());
        String phone = normalizer.phone(request.phoneNumber());
        boolean sensitiveChange = !email.equals(user.getEmail()) || !phone.equals(user.getPhoneNumber());
        if (sensitiveChange && (request.currentPassword() == null
                || !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash()))) {
            throw new ApiRequestException(HttpStatus.BAD_REQUEST, "CURRENT_PASSWORD_INVALID", "Current password is invalid");
        }
        if (users.existsByEmailAndIdNot(email, userId)) {
            throw new ApiRequestException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "Email is already registered");
        }
        if (users.existsByPhoneNumberAndIdNot(phone, userId)) {
            throw new ApiRequestException(HttpStatus.CONFLICT, "PHONE_ALREADY_REGISTERED", "Phone number is already registered");
        }
        user.updateProfile(request.firstName().trim(), request.lastName().trim(), email, phone);
        return AccountResponse.from(users.save(user));
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        UserEntity user = required(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiRequestException(HttpStatus.BAD_REQUEST, "CURRENT_PASSWORD_INVALID", "Current password is invalid");
        }
        passwordPolicy.validate(request.newPassword());
        user.changePassword(passwordEncoder.encode(request.newPassword()));
        users.save(user);
    }

    private UserEntity required(Long id) {
        return users.findById(id).orElseThrow(() -> new ApiRequestException(
                HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Authentication is required"
        ));
    }
}
