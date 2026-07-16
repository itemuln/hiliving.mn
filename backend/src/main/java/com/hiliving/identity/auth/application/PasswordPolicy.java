package com.hiliving.identity.auth.application;

import com.hiliving.api.error.ApiRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class PasswordPolicy {

    public void validate(String password) {
        boolean valid = password != null
                && password.length() >= 10
                && password.chars().anyMatch(Character::isLetter)
                && password.chars().anyMatch(Character::isDigit)
                && password.getBytes(StandardCharsets.UTF_8).length <= 72;
        if (!valid) {
            throw new ApiRequestException(
                    HttpStatus.BAD_REQUEST,
                    "PASSWORD_POLICY_VIOLATION",
                    "Password must contain 10 or more characters, including a letter and a number"
            );
        }
    }
}
