package com.hiliving.identity.auth.application;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

@Component
public class SecureTokenService {
    private final SecureRandom random = new SecureRandom();

    public IssuedToken issue() {
        byte[] entropy = new byte[32];
        random.nextBytes(entropy);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(entropy);
        return new IssuedToken(raw, hash(raw));
    }

    public String hash(String rawToken) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable", impossible);
        }
    }

    public boolean matches(String rawToken, String expectedHash) {
        return MessageDigest.isEqual(hash(rawToken).getBytes(StandardCharsets.US_ASCII),
                expectedHash.getBytes(StandardCharsets.US_ASCII));
    }

    public record IssuedToken(String raw, String hash) {}
}
