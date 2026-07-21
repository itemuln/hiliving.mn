package com.hiliving.identity.auth.application;

import com.hiliving.api.error.ApiRequestException;
import com.hiliving.identity.account.api.AccountResponse;
import com.hiliving.identity.auth.api.LoginRequest;
import com.hiliving.identity.auth.api.RegisterRequest;
import com.hiliving.identity.user.application.IdentityNormalizer;
import com.hiliving.identity.user.persistence.MembershipTierEntity;
import com.hiliving.identity.user.persistence.MembershipTierRepository;
import com.hiliving.identity.user.persistence.UserEntity;
import com.hiliving.identity.user.persistence.UserRepository;
import com.hiliving.identity.user.persistence.UserStatus;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;

@Service
public class AuthService {
    static final int MAX_FAILED_ATTEMPTS = 5;
    static final long LOCK_SECONDS = 15 * 60L;

    private final UserRepository users;
    private final MembershipTierRepository memberships;
    private final IdentityNormalizer normalizer;
    private final PasswordPolicy passwordPolicy;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerification;
    private final Clock clock;
    private final String dummyPasswordHash;

    public AuthService(
            UserRepository users,
            MembershipTierRepository memberships,
            IdentityNormalizer normalizer,
            PasswordPolicy passwordPolicy,
            PasswordEncoder passwordEncoder,
            EmailVerificationService emailVerification
    ) {
        this.users = users;
        this.memberships = memberships;
        this.normalizer = normalizer;
        this.passwordPolicy = passwordPolicy;
        this.passwordEncoder = passwordEncoder;
        this.emailVerification = emailVerification;
        this.clock = Clock.systemUTC();
        this.dummyPasswordHash = passwordEncoder.encode("non-user timing comparison 9274");
    }

    @Transactional
    public AccountResponse register(RegisterRequest request) {
        return register(request, "unknown");
    }

    @Transactional
    public AccountResponse register(RegisterRequest request, String requestedIp) {
        String email = normalizer.email(request.email());
        String phone = normalizer.phone(request.phoneNumber());
        passwordPolicy.validate(request.password());
        if (users.existsByEmail(email)) throw conflict("EMAIL_ALREADY_REGISTERED", "Email is already registered");
        if (users.existsByPhoneNumber(phone)) throw conflict("PHONE_ALREADY_REGISTERED", "Phone number is already registered");

        MembershipTierEntity regular = memberships.findByCodeAndActiveTrue("REGULAR")
                .orElseThrow(() -> new IllegalStateException("REGULAR membership tier is unavailable"));
        UserEntity user = UserEntity.customer(
                request.firstName().trim(), request.lastName().trim(), email, phone,
                passwordEncoder.encode(request.password()), regular
        );
        UserEntity saved = users.saveAndFlush(user);
        emailVerification.issueForRegistration(saved, requestedIp);
        return AccountResponse.from(saved);
    }

    @Transactional(noRollbackFor = ApiRequestException.class)
    public UserEntity login(LoginRequest request) {
        Optional<UserEntity> found;
        try {
            String identifier = normalizer.loginIdentifier(request.identifier());
            found = identifier.contains("@") ? users.findByEmail(identifier) : users.findByPhoneNumber(identifier);
        } catch (ApiRequestException exception) {
            passwordEncoder.matches(request.password(), dummyPasswordHash);
            throw invalidCredentials();
        }

        if (found.isEmpty()) {
            passwordEncoder.matches(request.password(), dummyPasswordHash);
            throw invalidCredentials();
        }

        UserEntity user = found.get();
        Instant now = Instant.now(clock);
        boolean passwordMatches = passwordEncoder.matches(request.password(), user.getPasswordHash());
        if (!passwordMatches) {
            if (user.getStatus() == UserStatus.ACTIVE && !user.isTemporarilyLocked(now)) {
                user.registerFailedLogin(now, MAX_FAILED_ATTEMPTS, LOCK_SECONDS);
                users.saveAndFlush(user);
            }
            throw invalidCredentials();
        }
        if (user.getStatus() == UserStatus.DISABLED) {
            throw new ApiRequestException(HttpStatus.UNAUTHORIZED, "ACCOUNT_DISABLED", "Account is disabled");
        }
        if (user.getStatus() == UserStatus.LOCKED || user.isTemporarilyLocked(now)) {
            throw new ApiRequestException(HttpStatus.UNAUTHORIZED, "ACCOUNT_LOCKED", "Account is temporarily locked");
        }
        user.recordSuccessfulLogin(now);
        return users.save(user);
    }

    private ApiRequestException conflict(String code, String message) {
        return new ApiRequestException(HttpStatus.CONFLICT, code, message);
    }

    private ApiRequestException invalidCredentials() {
        return new ApiRequestException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid credentials");
    }
}
