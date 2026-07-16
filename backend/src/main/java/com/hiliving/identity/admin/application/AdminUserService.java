package com.hiliving.identity.admin.application;

import com.hiliving.api.PagedResponse;
import com.hiliving.api.error.ApiRequestException;
import com.hiliving.identity.account.api.AccountResponse;
import com.hiliving.identity.user.persistence.MembershipTierRepository;
import com.hiliving.identity.user.persistence.UserEntity;
import com.hiliving.identity.user.persistence.UserRepository;
import com.hiliving.identity.user.persistence.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.Map;

@Service
public class AdminUserService {
    private static final Map<String, Sort> SORTS = Map.of(
            "newest", Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id")),
            "name_asc", Sort.by("lastName", "firstName", "id"),
            "email_asc", Sort.by("email", "id")
    );

    private final UserRepository users;
    private final MembershipTierRepository memberships;

    public AdminUserService(UserRepository users, MembershipTierRepository memberships) {
        this.users = users;
        this.memberships = memberships;
    }

    @Transactional(readOnly = true)
    public PagedResponse<AccountResponse> search(int page, int size, String search, String sort) {
        Sort selected = SORTS.get(sort);
        if (selected == null) throw new ApiRequestException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Unsupported sort value");
        Page<UserEntity> result = users.search(search == null ? "" : search.trim(), PageRequest.of(page, size, selected));
        return new PagedResponse<>(
                result.getContent().stream().map(AccountResponse::from).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(),
                result.isFirst(), result.isLast()
        );
    }

    @Transactional(readOnly = true)
    public AccountResponse find(Long userId) { return AccountResponse.from(required(userId)); }

    @Transactional
    public AccountResponse updateStatus(Long userId, String value) {
        UserStatus status;
        try { status = UserStatus.valueOf(value.trim().toUpperCase(Locale.ROOT)); }
        catch (RuntimeException exception) {
            throw new ApiRequestException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Unsupported user status");
        }
        UserEntity user = required(userId);
        user.changeStatus(status);
        return AccountResponse.from(users.save(user));
    }

    @Transactional
    public AccountResponse updateMembership(Long userId, String code) {
        UserEntity user = required(userId);
        var membership = memberships.findByCodeAndActiveTrue(code.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ApiRequestException(HttpStatus.NOT_FOUND, "MEMBERSHIP_NOT_FOUND", "Membership was not found"));
        user.changeMembership(membership);
        return AccountResponse.from(users.save(user));
    }

    @Transactional
    public AccountResponse updateDiscount(Long userId, BigDecimal discount) {
        if (discount != null && (discount.signum() < 0 || discount.compareTo(new BigDecimal("100.00")) > 0)) {
            throw new ApiRequestException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Discount must be between 0 and 100");
        }
        UserEntity user = required(userId);
        user.changeDiscountOverride(discount);
        return AccountResponse.from(users.save(user));
    }

    private UserEntity required(Long id) {
        return users.findById(id).orElseThrow(() -> new ApiRequestException(
                HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User was not found"
        ));
    }
}
