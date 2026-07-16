package com.hiliving.identity.user.application;

import com.hiliving.api.error.ApiRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.regex.Pattern;

@Component
public class IdentityNormalizer {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_INPUT = Pattern.compile("^[+0-9() .-]+$");

    public String email(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        if (normalized.length() > 254 || !EMAIL.matcher(normalized).matches()) {
            throw validation("email", "Enter a valid email address");
        }
        return normalized;
    }

    public String phone(String value) {
        String input = value == null ? "" : value.trim();
        if (!PHONE_INPUT.matcher(input).matches()) {
            throw validation("phoneNumber", "Enter a valid Mongolian phone number");
        }
        String digits = input.replaceAll("[^0-9]", "");
        if (digits.startsWith("976") && digits.length() == 11) digits = digits.substring(3);
        if (digits.length() != 8) {
            throw validation("phoneNumber", "Enter an 8-digit Mongolian phone number");
        }
        return "+976" + digits;
    }

    public String loginIdentifier(String value) {
        String input = value == null ? "" : value.trim();
        return input.contains("@") ? email(input) : phone(input);
    }

    private ApiRequestException validation(String field, String message) {
        return new ApiRequestException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", field + ": " + message);
    }
}
