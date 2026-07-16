package com.hiliving.identity;

import com.hiliving.TestcontainersConfiguration;
import com.hiliving.identity.auth.api.RegisterRequest;
import com.hiliving.identity.auth.application.AuthService;
import com.hiliving.identity.user.persistence.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@Transactional
class IdentityRepositoryIntegrationTests {
    @Autowired JdbcTemplate jdbc;
    @Autowired AuthService authService;
    @Autowired UserRepository users;

    @Test
    void migrationSeedsPermanentMembershipTiersAndRegistrationNormalizesIdentity() {
        assertThat(jdbc.queryForList(
                "select code from membership_tiers order by sort_order", String.class
        )).containsExactly("REGULAR", "BRONZE", "SILVER", "GOLD");

        var account = authService.register(new RegisterRequest(
                " Temuulen ", " Ikhmandal ", "9911-2233", "  PERSON@Example.COM ", "StrongPass123"
        ));
        var stored = users.findById(account.id()).orElseThrow();
        assertThat(stored.getEmail()).isEqualTo("person@example.com");
        assertThat(stored.getPhoneNumber()).isEqualTo("+97699112233");
        assertThat(stored.getPasswordHash()).startsWith("{bcrypt}").doesNotContain("StrongPass123");
        assertThat(account.membership().effectiveDiscountPercentage()).isEqualByComparingTo("0.00");
    }

    @Test
    void databaseRejectsDuplicateEmailAndPhone() {
        long membership = regularMembership();
        insertUser("one@example.com", "+97690000001", membership, null);
        assertThatThrownBy(() -> insertUser("one@example.com", "+97690000002", membership, null))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseRejectsDuplicatePhone() {
        long membership = regularMembership();
        insertUser("phone-one@example.com", "+97690000007", membership, null);
        assertThatThrownBy(() -> insertUser("phone-two@example.com", "+97690000007", membership, null))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseRejectsInvalidMembershipAndDiscount() {
        assertThatThrownBy(() -> insertUser("bad@example.com", "+97690000003", 999999, null))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseRejectsDiscountOutsidePercentageRange() {
        assertThatThrownBy(() -> insertUser(
                "discount@example.com", "+97690000008", regularMembership(), new BigDecimal("100.01")
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseEnforcesOneDefaultAddressPerUser() {
        long membership = regularMembership();
        long userId = insertUser("address@example.com", "+97690000004", membership, BigDecimal.TEN);
        insertAddress(userId, true, "+97690000005");
        assertThatThrownBy(() -> insertAddress(userId, true, "+97690000006"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private long regularMembership() {
        return jdbc.queryForObject("select id from membership_tiers where code='REGULAR'", Long.class);
    }

    private long insertUser(String email, String phone, long membership, BigDecimal discount) {
        return jdbc.queryForObject("""
                insert into users (first_name,last_name,email,phone_number,password_hash,role,status,membership_tier_id,discount_override_percentage)
                values ('Test','User',?,?, '{bcrypt}test','CUSTOMER','ACTIVE',?,?) returning id
                """, Long.class, email, phone, membership, discount);
    }

    private void insertAddress(long userId, boolean isDefault, String phone) {
        jdbc.update("""
                insert into user_addresses (user_id,label,city_or_province,district_or_soum,address_line,recipient_name,recipient_phone,is_default)
                values (?, 'Home', 'Ulaanbaatar', 'Sukhbaatar', 'Street 1', 'Recipient', ?, ?)
                """, userId, phone, isDefault);
    }
}
