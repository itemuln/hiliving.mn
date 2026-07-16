package com.hiliving.api.error;

import org.springframework.http.HttpStatus;

public class ApiRequestException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public ApiRequestException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
