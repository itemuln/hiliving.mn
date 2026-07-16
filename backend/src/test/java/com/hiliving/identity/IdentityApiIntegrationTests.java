package com.hiliving.identity;

import com.hiliving.TestcontainersConfiguration;
import com.hiliving.identity.user.persistence.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest
@Transactional
class IdentityApiIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired UserRepository users;

    @Test
    void registrationIsPublicValidatesDuplicatesAndNeverReturnsSecurityFields() throws Exception {
        register("member@example.com", "99110001")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.email").value("member@example.com"))
                .andExpect(jsonPath("$.data.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.data.membership.code").value("REGULAR"))
                .andExpect(jsonPath("$..passwordHash").doesNotExist());

        register(" MEMBER@example.com ", "99110002")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("EMAIL_ALREADY_REGISTERED"));
        register("another@example.com", "+976 9911 0001")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("PHONE_ALREADY_REGISTERED"));
    }

    @Test
    void csrfIsRequiredAndCatalogRemainsPublic() throws Exception {
        mockMvc.perform(get("/api/v1/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andExpect(jsonPath("$.data.headerName").value("X-XSRF-TOKEN"));
        mockMvc.perform(post("/api/v1/auth/register").contentType("application/json").content(registrationJson("csrf@example.com", "99110003")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/categories")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/account/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("AUTHENTICATION_REQUIRED"));
    }

    @Test
    void loginByEmailAndPhoneCreatesSessionRotatesIdAndLogoutInvalidatesIt() throws Exception {
        register("login@example.com", "99110004").andExpect(status().isCreated());
        MockHttpSession prior = new MockHttpSession();
        String priorId = prior.getId();
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login").with(realCsrf()).session(prior)
                        .contentType("application/json").content("{\"identifier\":\"LOGIN@example.com\",\"password\":\"StrongPass123\"}"))
                .andExpect(status().isOk()).andReturn();
        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        assertThat(session).isNotNull();
        assertThat(session.getId()).isNotEqualTo(priorId);

        mockMvc.perform(get("/api/v1/account/me").session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.email").value("login@example.com"));
        mockMvc.perform(post("/api/v1/auth/logout").with(realCsrf()).session(session))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/account/me").session(session)).andExpect(status().isUnauthorized());

        MockHttpSession phoneSession = login("+97699110004", "StrongPass123");
        mockMvc.perform(get("/api/v1/account/me").session(phoneSession)).andExpect(status().isOk());
    }

    @Test
    void invalidCredentialsAreGenericAndFailedAttemptsTemporarilyLockAccount() throws Exception {
        register("lock@example.com", "99110005").andExpect(status().isCreated());
        for (int attempt = 0; attempt < 5; attempt++) {
            mockMvc.perform(post("/api/v1/auth/login").with(realCsrf()).contentType("application/json")
                            .content("{\"identifier\":\"lock@example.com\",\"password\":\"WrongPass999\"}"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"))
                    .andExpect(jsonPath("$.error.message").value("Invalid credentials"));
        }
        var user = users.findByEmail("lock@example.com").orElseThrow();
        assertThat(user.getFailedLoginAttempts()).isEqualTo(5);
        assertThat(user.getLockedUntil()).isNotNull();
        mockMvc.perform(post("/api/v1/auth/login").with(realCsrf()).contentType("application/json")
                        .content("{\"identifier\":\"lock@example.com\",\"password\":\"StrongPass123\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error.code").value("ACCOUNT_LOCKED"));

        mockMvc.perform(post("/api/v1/auth/login").with(realCsrf()).contentType("application/json")
                        .content("{\"identifier\":\"missing@example.com\",\"password\":\"WrongPass999\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void disabledAndExplicitlyLockedAccountsCannotAuthenticate() throws Exception {
        register("disabled@example.com", "99110014").andExpect(status().isCreated());
        register("explicit-lock@example.com", "99110015").andExpect(status().isCreated());
        var disabled = users.findByEmail("disabled@example.com").orElseThrow();
        disabled.changeStatus(com.hiliving.identity.user.persistence.UserStatus.DISABLED);
        var locked = users.findByEmail("explicit-lock@example.com").orElseThrow();
        locked.changeStatus(com.hiliving.identity.user.persistence.UserStatus.LOCKED);
        users.saveAndFlush(disabled);
        users.saveAndFlush(locked);

        loginFailure("disabled@example.com", "StrongPass123", "ACCOUNT_DISABLED");
        loginFailure("explicit-lock@example.com", "StrongPass123", "ACCOUNT_LOCKED");
    }

    @Test
    void successfulLoginResetsFailedAttemptState() throws Exception {
        register("reset-attempts@example.com", "99110016").andExpect(status().isCreated());
        loginFailure("reset-attempts@example.com", "WrongPass999", "INVALID_CREDENTIALS");
        loginFailure("reset-attempts@example.com", "WrongPass999", "INVALID_CREDENTIALS");
        login("reset-attempts@example.com", "StrongPass123");
        var user = users.findByEmail("reset-attempts@example.com").orElseThrow();
        assertThat(user.getFailedLoginAttempts()).isZero();
        assertThat(user.getLockedUntil()).isNull();
        assertThat(user.getLastLoginAt()).isNotNull();
    }

    @Test
    void profilePasswordAndMembershipEndpointsReturnSafeAccountData() throws Exception {
        register("profile@example.com", "99110006").andExpect(status().isCreated());
        MockHttpSession session = login("profile@example.com", "StrongPass123");
        mockMvc.perform(patch("/api/v1/account/profile").with(realCsrf()).session(session)
                        .contentType("application/json").content("""
                        {"firstName":"Updated","lastName":"Person","email":"updated@example.com","phoneNumber":"99110007","currentPassword":"StrongPass123"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.firstName").value("Updated"))
                .andExpect(jsonPath("$.data.phoneNumber").value("+97699110007"));
        mockMvc.perform(post("/api/v1/account/password").with(realCsrf()).session(session)
                        .contentType("application/json").content("{\"currentPassword\":\"bad\",\"newPassword\":\"NewStrong456\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("CURRENT_PASSWORD_INVALID"));
        mockMvc.perform(post("/api/v1/account/password").with(realCsrf()).session(session)
                        .contentType("application/json").content("{\"currentPassword\":\"StrongPass123\",\"newPassword\":\"NewStrong456\"}"))
                .andExpect(status().isNoContent());
        login("updated@example.com", "NewStrong456");
    }

    @Test
    void profileUpdateRejectsAnotherUsersEmailAndPhone() throws Exception {
        register("profile-one@example.com", "99110017").andExpect(status().isCreated());
        register("profile-two@example.com", "99110018").andExpect(status().isCreated());
        MockHttpSession session = login("profile-one@example.com", "StrongPass123");
        mockMvc.perform(patch("/api/v1/account/profile").with(realCsrf()).session(session)
                        .contentType("application/json").content("""
                        {"firstName":"One","lastName":"User","email":"profile-two@example.com","phoneNumber":"99110017","currentPassword":"StrongPass123"}
                        """))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("EMAIL_ALREADY_REGISTERED"));
        mockMvc.perform(patch("/api/v1/account/profile").with(realCsrf()).session(session)
                        .contentType("application/json").content("""
                        {"firstName":"One","lastName":"User","email":"profile-one@example.com","phoneNumber":"99110018","currentPassword":"StrongPass123"}
                        """))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("PHONE_ALREADY_REGISTERED"));
    }

    @Test
    void addressesAreOwnedAndDefaultSwitchingIsTransactional() throws Exception {
        register("owner@example.com", "99110008").andExpect(status().isCreated());
        register("other@example.com", "99110009").andExpect(status().isCreated());
        MockHttpSession owner = login("owner@example.com", "StrongPass123");
        MockHttpSession other = login("other@example.com", "StrongPass123");
        MvcResult first = mockMvc.perform(post("/api/v1/account/addresses").with(realCsrf()).session(owner)
                        .contentType("application/json").content(addressJson("Home", "99110010", true)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.defaultAddress").value(true)).andReturn();
        long firstId = ((Number) com.jayway.jsonpath.JsonPath.read(first.getResponse().getContentAsString(), "$.data.id")).longValue();
        mockMvc.perform(patch("/api/v1/account/addresses/{id}", firstId).with(realCsrf()).session(owner)
                        .contentType("application/json").content(addressJson("Updated home", "99110010", false)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.label").value("Updated home"));
        mockMvc.perform(post("/api/v1/account/addresses").with(realCsrf()).session(owner)
                        .contentType("application/json").content(addressJson("Work", "99110011", true)))
                .andExpect(status().isCreated());
        mockMvc.perform(get("/api/v1/account/addresses").session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].label").value("Work"))
                .andExpect(jsonPath("$.data[1].defaultAddress").value(false));
        mockMvc.perform(delete("/api/v1/account/addresses/{id}", firstId).with(realCsrf()).session(other))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.error.code").value("ADDRESS_NOT_FOUND"));
        mockMvc.perform(delete("/api/v1/account/addresses/{id}", firstId).with(realCsrf()).session(owner))
                .andExpect(status().isNoContent());
    }

    @Test
    void customerCannotUseAdminEndpointsWhileAdminCanUpdateAccountPolicy() throws Exception {
        register("customer@example.com", "99110012").andExpect(status().isCreated());
        register("admin@example.com", "99110013").andExpect(status().isCreated());
        MockHttpSession customer = login("customer@example.com", "StrongPass123");
        mockMvc.perform(get("/api/v1/admin/users").session(customer))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));

        var admin = users.findByEmail("admin@example.com").orElseThrow();
        org.springframework.test.util.ReflectionTestUtils.setField(admin, "role", com.hiliving.identity.user.persistence.UserRole.ADMIN);
        users.saveAndFlush(admin);
        MockHttpSession adminSession = login("admin@example.com", "StrongPass123");
        var customerUser = users.findByEmail("customer@example.com").orElseThrow();
        mockMvc.perform(get("/api/v1/admin/users").session(adminSession).param("search", "customer"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        mockMvc.perform(patch("/api/v1/admin/users/{id}/membership", customerUser.getId()).with(realCsrf()).session(adminSession)
                        .contentType("application/json").content("{\"membershipCode\":\"GOLD\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.membership.effectiveDiscountPercentage").value(10.0));
        mockMvc.perform(patch("/api/v1/admin/users/{id}/discount", customerUser.getId()).with(realCsrf()).session(adminSession)
                        .contentType("application/json").content("{\"discountOverridePercentage\":12.50}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.membership.effectiveDiscountPercentage").value(12.5));
        mockMvc.perform(patch("/api/v1/admin/users/{id}/status", customerUser.getId()).with(realCsrf()).session(adminSession)
                        .contentType("application/json").content("{\"status\":\"DISABLED\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("DISABLED"));
    }

    private org.springframework.test.web.servlet.ResultActions register(String email, String phone) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/register").with(realCsrf()).contentType("application/json")
                .content(registrationJson(email, phone)));
    }

    private MockHttpSession login(String identifier, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login").with(realCsrf()).contentType("application/json")
                        .content("{\"identifier\":\"" + identifier + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$..passwordHash").doesNotExist()).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private void loginFailure(String identifier, String password, String code) throws Exception {
        mockMvc.perform(post("/api/v1/auth/login").with(realCsrf()).contentType("application/json")
                        .content("{\"identifier\":\"" + identifier + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error.code").value(code));
    }

    private String registrationJson(String email, String phone) {
        return "{\"firstName\":\"Test\",\"lastName\":\"Person\",\"phoneNumber\":\"" + phone
                + "\",\"email\":\"" + email + "\",\"password\":\"StrongPass123\"}";
    }

    private String addressJson(String label, String phone, boolean isDefault) {
        return "{\"label\":\"" + label + "\",\"cityOrProvince\":\"Ulaanbaatar\",\"districtOrSoum\":\"Sukhbaatar\","
                + "\"khorooOrBag\":\"1st khoroo\",\"addressLine\":\"Peace Avenue 1\",\"additionalDetails\":\"Door 2\","
                + "\"recipientName\":\"Test Person\",\"recipientPhone\":\"" + phone + "\",\"defaultAddress\":" + isDefault + "}";
    }

    private RequestPostProcessor realCsrf() throws Exception {
        MvcResult csrfResult = mockMvc.perform(get("/api/v1/auth/csrf")).andExpect(status().isOk()).andReturn();
        jakarta.servlet.http.Cookie cookie = csrfResult.getResponse().getCookie("XSRF-TOKEN");
        assertThat(cookie).isNotNull();
        return request -> {
            request.addHeader("X-XSRF-TOKEN", cookie.getValue());
            request.setCookies(cookie);
            return request;
        };
    }
}
