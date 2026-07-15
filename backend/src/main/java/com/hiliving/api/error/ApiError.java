package com.hiliving.api.error;

import java.time.Instant;
import java.util.List;

public record ApiError(
        String code,
        String message,
        String path,
        Instant timestamp,
        List<ApiFieldError> fieldErrors
) {
}
