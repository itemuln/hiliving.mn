package com.hiliving.identity.auth.security;

import tools.jackson.databind.ObjectMapper;
import com.hiliving.api.error.ApiError;
import com.hiliving.api.error.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Component
public class ApiSecurityErrorWriter {
    private final ObjectMapper objectMapper;

    public ApiSecurityErrorWriter(ObjectMapper objectMapper) { this.objectMapper = objectMapper; }

    public void write(HttpServletRequest request, HttpServletResponse response, int status, String code, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), new ApiErrorResponse(
                new ApiError(code, message, request.getRequestURI(), Instant.now(), List.of())
        ));
    }
}
