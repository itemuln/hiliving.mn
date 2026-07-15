package com.hiliving.api.error;

import java.util.List;

public class InvalidRequestException extends RuntimeException {

    private final List<ApiFieldError> fieldErrors;

    public InvalidRequestException(String field, String message) {
        super("Request validation failed");
        this.fieldErrors = List.of(new ApiFieldError(field, message));
    }

    public List<ApiFieldError> getFieldErrors() {
        return fieldErrors;
    }
}
