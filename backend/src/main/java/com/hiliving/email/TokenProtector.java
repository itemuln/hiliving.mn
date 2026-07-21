package com.hiliving.email;

import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class TokenProtector {
    private static final int NONCE_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final byte[] CONTEXT = "hiliving-email-token-v1".getBytes(StandardCharsets.UTF_8);

    private final SecureRandom random = new SecureRandom();
    private final SecretKeySpec key;

    public TokenProtector(EmailProperties properties) {
        byte[] decoded;
        if (properties.tokenProtectionKey() == null || properties.tokenProtectionKey().isBlank()) {
            decoded = new byte[32];
            random.nextBytes(decoded);
        } else {
            try {
                decoded = Base64.getDecoder().decode(properties.tokenProtectionKey().trim());
            } catch (IllegalArgumentException exception) {
                throw new IllegalStateException("EMAIL_TOKEN_PROTECTION_KEY must be standard Base64", exception);
            }
            if (decoded.length != 32) {
                throw new IllegalStateException("EMAIL_TOKEN_PROTECTION_KEY must decode to exactly 32 bytes");
            }
        }
        key = new SecretKeySpec(decoded, "AES");
    }

    public String protect(String rawToken) {
        byte[] nonce = new byte[NONCE_BYTES];
        random.nextBytes(nonce);
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, nonce));
            cipher.updateAAD(CONTEXT);
            byte[] encrypted = cipher.doFinal(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(ByteBuffer.allocate(nonce.length + encrypted.length).put(nonce).put(encrypted).array());
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to protect email token", exception);
        }
    }

    public String unprotect(String protectedToken) {
        try {
            byte[] value = Base64.getUrlDecoder().decode(protectedToken);
            if (value.length <= NONCE_BYTES + 16) throw new GeneralSecurityException("Invalid protected token");
            byte[] nonce = new byte[NONCE_BYTES];
            byte[] encrypted = new byte[value.length - NONCE_BYTES];
            System.arraycopy(value, 0, nonce, 0, nonce.length);
            System.arraycopy(value, nonce.length, encrypted, 0, encrypted.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, nonce));
            cipher.updateAAD(CONTEXT);
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException exception) {
            throw new IllegalStateException("Unable to read protected email token", exception);
        }
    }
}
