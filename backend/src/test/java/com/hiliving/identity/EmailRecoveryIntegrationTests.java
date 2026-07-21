package com.hiliving.identity;

import com.hiliving.TestcontainersConfiguration;
import com.hiliving.email.EmailEventType;
import com.hiliving.email.EmailPayloads;
import com.hiliving.email.TokenProtector;
import com.hiliving.email.outbox.EmailOutboxEntity;
import com.hiliving.email.outbox.EmailOutboxRepository;
import com.hiliving.identity.auth.persistence.EmailVerificationTokenRepository;
import com.hiliving.identity.auth.persistence.PasswordResetTokenRepository;
import com.hiliving.identity.auth.application.PasswordRecoveryService;
import com.hiliving.identity.auth.api.PasswordResetConfirmRequest;
import com.hiliving.api.error.ApiRequestException;
import com.hiliving.identity.user.persistence.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest
class EmailRecoveryIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired EmailOutboxRepository outbox;
    @Autowired EmailVerificationTokenRepository verificationTokens;
    @Autowired PasswordResetTokenRepository resetTokens;
    @Autowired TokenProtector tokenProtector;
    @Autowired ObjectMapper objectMapper;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired PasswordRecoveryService passwordRecovery;

    @BeforeEach
    void clean() {
        jdbc.execute("TRUNCATE TABLE email_outbox, admin_audit_log, users RESTART IDENTITY CASCADE");
    }

    @Test
    void registrationStoresOnlyHashedVerificationTokenAndConfirmationIsSinglePurposeAndIdempotent() throws Exception {
        register("verify@example.com", "99112001", "10.1.0.1").andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.emailVerified").value(false))
                .andExpect(jsonPath("$.data.emailVerifiedAt").isEmpty());

        String raw = rawVerificationToken();
        var stored = verificationTokens.findAll().getFirst();
        EmailOutboxEntity email = outbox.findAll().getFirst();
        assertThat(stored.getTokenHash()).hasSize(64).isNotEqualTo(raw);
        assertThat(email.getPayload()).doesNotContain(raw).doesNotContain("StrongPass123");
        assertThat(email.getEventType()).isEqualTo(EmailEventType.EMAIL_VERIFICATION);

        confirmVerification(raw, "10.1.0.2").andExpect(status().isOk());
        assertThat(users.findByEmail("verify@example.com").orElseThrow().getEmailVerifiedAt()).isNotNull();
        confirmVerification(raw, "10.1.0.3").andExpect(status().isOk());

        requestPasswordReset("verify@example.com", "10.1.0.4").andExpect(status().isOk());
        String resetRaw = rawPasswordResetToken();
        confirmVerification(resetRaw, "10.1.0.5").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("EMAIL_VERIFICATION_TOKEN_INVALID"));
    }

    @Test
    void newVerificationRequestInvalidatesOlderTokenAndRequestIsRateLimited() throws Exception {
        register("resend@example.com", "99112002", "10.2.0.1").andExpect(status().isCreated());
        String oldToken = rawVerificationToken();
        MockHttpSession session = login("resend@example.com", "StrongPass123", "10.2.0.2");

        requestVerification(session, "10.2.0.3").andExpect(status().isOk());
        assertThat(verificationTokens.findAll()).hasSize(2);
        assertThat(verificationTokens.findAll().stream().filter(token -> token.getUsedAt() != null)).hasSize(1);
        confirmVerification(oldToken, "10.2.0.4").andExpect(status().isBadRequest());
        confirmVerification(rawVerificationToken(), "10.2.0.5").andExpect(status().isOk());

        register("rate@example.com", "99112003", "10.2.1.1").andExpect(status().isCreated());
        MockHttpSession rateSession = login("rate@example.com", "StrongPass123", "10.2.1.2");
        requestVerification(rateSession, "10.2.1.3").andExpect(status().isOk());
        requestVerification(rateSession, "10.2.1.3").andExpect(status().isOk());
        requestVerification(rateSession, "10.2.1.3").andExpect(status().isOk());
        requestVerification(rateSession, "10.2.1.3").andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.error.code").value("RATE_LIMITED"));
    }

    @Test
    void passwordResetRequestDoesNotEnumerateAndUnverifiedAccountIsIneligible() throws Exception {
        register("unverified@example.com", "99112004", "10.3.0.1").andExpect(status().isCreated());
        String unknownBody = requestPasswordReset("missing@example.com", "10.3.0.2")
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String unverifiedBody = requestPasswordReset("unverified@example.com", "10.3.0.3")
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(unverifiedBody).isEqualTo(unknownBody);
        assertThat(resetTokens.findAll()).isEmpty();

        confirmVerification(rawVerificationToken(), "10.3.0.4").andExpect(status().isOk());
        requestPasswordReset("unverified@example.com", "10.3.0.5").andExpect(status().isOk());
        assertThat(resetTokens.findAll()).hasSize(1);
        String raw = rawPasswordResetToken();
        assertThat(resetTokens.findAll().getFirst().getTokenHash()).isNotEqualTo(raw);
        EmailOutboxEntity resetEmail = latest(EmailEventType.PASSWORD_RESET);
        assertThat(resetEmail.getPayload()).doesNotContain(raw).doesNotContain("StrongPass123");
    }

    @Test
    void validResetChangesPasswordConsumesTokenQueuesConfirmationAndInvalidatesOnlyThatUsersSessions() throws Exception {
        register("reset@example.com", "99112005", "10.4.0.1").andExpect(status().isCreated());
        confirmVerification(rawVerificationToken(), "10.4.0.2").andExpect(status().isOk());
        register("other@example.com", "99112006", "10.4.0.3").andExpect(status().isCreated());
        MockHttpSession resetSession = login("reset@example.com", "StrongPass123", "10.4.0.4");
        MockHttpSession otherSession = login("other@example.com", "StrongPass123", "10.4.0.5");

        requestPasswordReset("reset@example.com", "10.4.0.6").andExpect(status().isOk());
        String raw = rawPasswordResetToken();
        confirmPasswordReset(raw, "NewStrong456", "NewStrong456", "10.4.0.7").andExpect(status().isOk());

        var user = users.findByEmail("reset@example.com").orElseThrow();
        assertThat(passwordEncoder.matches("NewStrong456", user.getPasswordHash())).isTrue();
        assertThat(passwordEncoder.matches("StrongPass123", user.getPasswordHash())).isFalse();
        assertThat(resetTokens.findAll().getFirst().getUsedAt()).isNotNull();
        assertThat(latest(EmailEventType.PASSWORD_RESET_CONFIRMATION)).isNotNull();

        mockMvc.perform(get("/api/v1/account/me").session(resetSession)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/account/me").session(otherSession)).andExpect(status().isOk());
        loginFailure("reset@example.com", "StrongPass123", "10.4.0.8");
        login("reset@example.com", "NewStrong456", "10.4.0.9");
        confirmPasswordReset(raw, "AnotherStrong789", "AnotherStrong789", "10.4.0.10")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("PASSWORD_RESET_TOKEN_INVALID"));
    }

    @Test
    void resetValidatesPasswordConfirmationAndPolicyWithoutConsumingToken() throws Exception {
        register("policy@example.com", "99112007", "10.5.0.1").andExpect(status().isCreated());
        confirmVerification(rawVerificationToken(), "10.5.0.2").andExpect(status().isOk());
        requestPasswordReset("policy@example.com", "10.5.0.3").andExpect(status().isOk());
        String raw = rawPasswordResetToken();

        confirmPasswordReset(raw, "NewStrong456", "Different789", "10.5.0.4")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("PASSWORD_CONFIRMATION_MISMATCH"));
        confirmPasswordReset(raw, "short", "short", "10.5.0.5")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("PASSWORD_POLICY_VIOLATION"));
        assertThat(resetTokens.findAll().getFirst().getUsedAt()).isNull();
    }

    @Test
    void expiredTokensFailAndNewResetInvalidatesTheOlderReset() throws Exception {
        register("expiry@example.com", "99112008", "10.6.0.1").andExpect(status().isCreated());
        String verificationRaw = rawVerificationToken();
        var verification = verificationTokens.findAll().getFirst();
        org.springframework.test.util.ReflectionTestUtils.setField(verification, "expiresAt", verification.getCreatedAt().plusMillis(1));
        verificationTokens.saveAndFlush(verification);
        confirmVerification(verificationRaw, "10.6.0.2").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("EMAIL_VERIFICATION_TOKEN_EXPIRED"));

        var user = users.findByEmail("expiry@example.com").orElseThrow();
        user.verifyEmail(Instant.now());
        users.saveAndFlush(user);
        requestPasswordReset("expiry@example.com", "10.6.0.3").andExpect(status().isOk());
        String firstReset = rawPasswordResetToken();
        requestPasswordReset("expiry@example.com", "10.6.0.4").andExpect(status().isOk());
        assertThat(resetTokens.findAll()).hasSize(2);
        assertThat(resetTokens.findAll().stream().filter(token -> token.getUsedAt() != null)).hasSize(1);
        confirmPasswordReset(firstReset, "NewStrong456", "NewStrong456", "10.6.0.5")
                .andExpect(status().isBadRequest());

        String newestReset = rawPasswordResetToken();
        var newest = resetTokens.findAll().stream().filter(token -> token.getUsedAt() == null).findFirst().orElseThrow();
        org.springframework.test.util.ReflectionTestUtils.setField(newest, "expiresAt", newest.getCreatedAt().plusMillis(1));
        resetTokens.saveAndFlush(newest);
        confirmPasswordReset(newestReset, "NewStrong456", "NewStrong456", "10.6.0.6")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("PASSWORD_RESET_TOKEN_INVALID"));
    }

    @Test
    void concurrentResetConfirmationAllowsExactlyOnePasswordChange() throws Exception {
        register("concurrent-reset@example.com", "99112009", "10.7.0.1").andExpect(status().isCreated());
        confirmVerification(rawVerificationToken(), "10.7.0.2").andExpect(status().isOk());
        requestPasswordReset("concurrent-reset@example.com", "10.7.0.3").andExpect(status().isOk());
        String raw = rawPasswordResetToken();
        PasswordResetConfirmRequest request = new PasswordResetConfirmRequest(raw, "ConcurrentPass123", "ConcurrentPass123");
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> confirmConcurrently(request, "10.7.0.4", start));
            var second = executor.submit(() -> confirmConcurrently(request, "10.7.0.5", start));
            start.countDown();
            assertThat((first.get() ? 1 : 0) + (second.get() ? 1 : 0)).isOne();
        }
        assertThat(passwordEncoder.matches("ConcurrentPass123",
                users.findByEmail("concurrent-reset@example.com").orElseThrow().getPasswordHash())).isTrue();
        assertThat(emailOutboxCount(EmailEventType.PASSWORD_RESET_CONFIRMATION)).hasSize(1);
    }

    private boolean confirmConcurrently(PasswordResetConfirmRequest request, String ip, CountDownLatch start) throws Exception {
        start.await();
        try {
            passwordRecovery.confirm(request, ip);
            return true;
        } catch (ApiRequestException exception) {
            return false;
        }
    }

    private java.util.List<EmailOutboxEntity> emailOutboxCount(EmailEventType type) {
        return outbox.findAll().stream().filter(email -> email.getEventType() == type).toList();
    }

    private org.springframework.test.web.servlet.ResultActions register(String email, String phone, String ip) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/register").with(realCsrf()).with(remote(ip))
                .contentType("application/json").content("{\"firstName\":\"Test\",\"lastName\":\"Person\",\"phoneNumber\":\""
                        + phone + "\",\"email\":\"" + email + "\",\"password\":\"StrongPass123\"}"));
    }

    private MockHttpSession login(String email, String password, String ip) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login").with(realCsrf()).with(remote(ip))
                        .contentType("application/json").content("{\"identifier\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk()).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private void loginFailure(String email, String password, String ip) throws Exception {
        mockMvc.perform(post("/api/v1/auth/login").with(realCsrf()).with(remote(ip)).contentType("application/json")
                .content("{\"identifier\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    private org.springframework.test.web.servlet.ResultActions requestVerification(MockHttpSession session, String ip) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/email-verification/request").with(realCsrf()).with(remote(ip)).session(session));
    }

    private org.springframework.test.web.servlet.ResultActions confirmVerification(String token, String ip) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/email-verification/confirm").with(realCsrf()).with(remote(ip))
                .contentType("application/json").content("{\"token\":\"" + token + "\"}"));
    }

    private org.springframework.test.web.servlet.ResultActions requestPasswordReset(String email, String ip) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/password-reset/request").with(realCsrf()).with(remote(ip))
                .contentType("application/json").content("{\"email\":\"" + email + "\"}"))
                .andExpect(jsonPath("$.data.message").value("If an account exists for that email, password reset instructions have been sent."));
    }

    private org.springframework.test.web.servlet.ResultActions confirmPasswordReset(String token, String password,
                                                                                     String confirmation, String ip) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/password-reset/confirm").with(realCsrf()).with(remote(ip))
                .contentType("application/json").content("{\"token\":\"" + token + "\",\"newPassword\":\""
                        + password + "\",\"confirmPassword\":\"" + confirmation + "\"}"));
    }

    private String rawVerificationToken() throws Exception {
        return rawToken(latest(EmailEventType.EMAIL_VERIFICATION), EmailPayloads.Verification.class);
    }

    private String rawPasswordResetToken() throws Exception {
        return rawToken(latest(EmailEventType.PASSWORD_RESET), EmailPayloads.PasswordReset.class);
    }

    private String rawToken(EmailOutboxEntity email, Class<?> payloadType) throws Exception {
        Object payload = objectMapper.readValue(email.getPayload(), payloadType);
        String protectedToken = payload instanceof EmailPayloads.Verification verification
                ? verification.protectedToken() : ((EmailPayloads.PasswordReset) payload).protectedToken();
        return tokenProtector.unprotect(protectedToken);
    }

    private EmailOutboxEntity latest(EmailEventType type) {
        return outbox.findAll().stream().filter(email -> email.getEventType() == type)
                .max(java.util.Comparator.comparing(EmailOutboxEntity::getId)).orElseThrow();
    }

    private RequestPostProcessor remote(String ip) { return request -> { request.setRemoteAddr(ip); return request; }; }

    private RequestPostProcessor realCsrf() throws Exception {
        MvcResult csrfResult = mockMvc.perform(get("/api/v1/auth/csrf")).andExpect(status().isOk()).andReturn();
        jakarta.servlet.http.Cookie cookie = csrfResult.getResponse().getCookie("XSRF-TOKEN");
        assertThat(cookie).isNotNull();
        return request -> { request.addHeader("X-XSRF-TOKEN", cookie.getValue()); request.setCookies(cookie); return request; };
    }
}
