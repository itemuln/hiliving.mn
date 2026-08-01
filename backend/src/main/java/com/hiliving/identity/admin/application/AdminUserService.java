package com.hiliving.identity.admin.application;

import com.hiliving.admin.audit.AuditService;
import com.hiliving.api.PagedResponse;
import com.hiliving.api.error.ApiRequestException;
import com.hiliving.commerce.order.CustomerOrderMetrics;
import com.hiliving.commerce.order.OrderEntity;
import com.hiliving.commerce.order.OrderRepository;
import com.hiliving.commerce.order.OrderStatus;
import com.hiliving.commerce.order.OrderSummaryResponse;
import com.hiliving.commerce.order.PaymentStatus;
import com.hiliving.identity.account.api.AccountResponse;
import com.hiliving.identity.account.api.AddressResponse;
import com.hiliving.identity.admin.api.AdminUserOrderOverviewResponse;
import com.hiliving.identity.admin.api.AdminUserSummaryResponse;
import com.hiliving.identity.user.persistence.MembershipTierRepository;
import com.hiliving.identity.user.persistence.UserAddressRepository;
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
import java.util.HashMap;
import java.util.List;
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
    private final UserAddressRepository addresses;
    private final OrderRepository orders;
    private final AuditService audit;

    public AdminUserService(UserRepository users, MembershipTierRepository memberships,
                            UserAddressRepository addresses, OrderRepository orders, AuditService audit) {
        this.users = users;
        this.memberships = memberships;
        this.addresses = addresses;
        this.orders = orders;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public PagedResponse<AdminUserSummaryResponse> search(int page, int size, String search, String membership, String status, String sort) {
        Sort selected = SORTS.get(sort);
        if (selected == null) throw new ApiRequestException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Unsupported sort value");
        Page<UserEntity> result = users.searchAdmin(search == null ? "" : search.trim(), upper(membership), upper(status), PageRequest.of(page, size, selected));
        Map<Long, CustomerOrderMetrics> metricsByCustomer = new HashMap<>();
        if (!result.isEmpty()) {
            orders.findCustomerMetrics(result.getContent().stream().map(UserEntity::getId).toList(), PaymentStatus.PAID)
                    .forEach(metrics -> metricsByCustomer.put(metrics.getCustomerId(), metrics));
        }
        return new PagedResponse<>(
                result.getContent().stream().map(user -> {
                    CustomerOrderMetrics metrics = metricsByCustomer.get(user.getId());
                    return AdminUserSummaryResponse.from(
                            user,
                            metrics == null ? 0 : metrics.getOrderCount(),
                            metrics == null ? BigDecimal.ZERO : metrics.getTotalPaid()
                    );
                }).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(),
                result.isFirst(), result.isLast()
        );
    }

    @Transactional(readOnly = true)
    public AccountResponse find(Long userId) { return AccountResponse.from(required(userId)); }

    @Transactional(readOnly = true)
    public List<AddressResponse> addresses(Long userId) {
        required(userId);
        return addresses.findAllByUserIdOrderByDefaultAddressDescCreatedAtAscIdAsc(userId).stream().map(AddressResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AdminUserOrderOverviewResponse orderOverview(Long userId, int page, int size) {
        required(userId);
        Page<OrderEntity> result =
                orders.findByCustomerIdOrderByPlacedAtDescIdDesc(userId, PageRequest.of(page, size));
        PagedResponse<OrderSummaryResponse> orderPage = new PagedResponse<>(
                result.getContent().stream().map(OrderSummaryResponse::from).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(),
                result.isFirst(), result.isLast()
        );
        return new AdminUserOrderOverviewResponse(
                orders.countByCustomerIdAndOrderStatus(userId, OrderStatus.CANCELLED),
                orders.countByCustomerIdAndOrderStatus(userId, OrderStatus.SHIPPED),
                orderPage
        );
    }

    @Transactional
    public AccountResponse updateStatus(Long userId, String value) {
        UserStatus status;
        try { status = UserStatus.valueOf(value.trim().toUpperCase(Locale.ROOT)); }
        catch (RuntimeException exception) {
            throw new ApiRequestException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Unsupported user status");
        }
        UserEntity user = required(userId);
        user.changeStatus(status);
        AccountResponse response = AccountResponse.from(users.save(user));
        audit.record("USER_STATUS_CHANGED", "USER", userId, status.name());
        return response;
    }

    @Transactional
    public AccountResponse updateMembership(Long userId, String code) {
        UserEntity user = required(userId);
        var membership = memberships.findByCodeAndActiveTrue(code.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ApiRequestException(HttpStatus.NOT_FOUND, "MEMBERSHIP_NOT_FOUND", "Membership was not found"));
        user.changeMembership(membership);
        AccountResponse response = AccountResponse.from(users.save(user));
        audit.record("USER_MEMBERSHIP_CHANGED", "USER", userId, membership.getCode());
        return response;
    }

    @Transactional
    public AccountResponse updateDiscount(Long userId, BigDecimal discount) {
        if (discount != null && (discount.signum() < 0 || discount.compareTo(new BigDecimal("100.00")) > 0)) {
            throw new ApiRequestException(HttpStatus.BAD_REQUEST, "DISCOUNT_OVERRIDE_INVALID", "Discount must be between 0 and 100");
        }
        UserEntity user = required(userId);
        user.changeDiscountOverride(discount);
        AccountResponse response = AccountResponse.from(users.save(user));
        audit.record("USER_DISCOUNT_OVERRIDE_CHANGED", "USER", userId, discount == null ? "cleared" : discount.toPlainString());
        return response;
    }

    private UserEntity required(Long id) {
        return users.findById(id).orElseThrow(() -> new ApiRequestException(
                HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User was not found"
        ));
    }

    private static String upper(String value) { return value == null || value.isBlank() ? "" : value.trim().toUpperCase(Locale.ROOT); }
}
