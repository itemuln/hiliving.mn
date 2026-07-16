package com.hiliving.api.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

import java.time.Instant;
import java.util.List;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ApiErrorResponse> handleNotFound(
            ResourceNotFoundException exception,
            HttpServletRequest request
    ) {
        return response(
                HttpStatus.NOT_FOUND,
                "RESOURCE_NOT_FOUND",
                exception.getMessage(),
                request,
                List.of()
        );
    }

    @ExceptionHandler(InvalidRequestException.class)
    ResponseEntity<ApiErrorResponse> handleInvalidRequest(
            InvalidRequestException exception,
            HttpServletRequest request
    ) {
        return response(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                exception.getMessage(),
                request,
                exception.getFieldErrors()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiErrorResponse> handleBodyValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        List<ApiFieldError> fieldErrors = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new ApiFieldError(error.getField(), error.getDefaultMessage()))
                .toList();
        return validationResponse(request, fieldErrors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiErrorResponse> handleConstraintViolation(
            ConstraintViolationException exception,
            HttpServletRequest request
    ) {
        List<ApiFieldError> fieldErrors = exception.getConstraintViolations().stream()
                .map(violation -> new ApiFieldError(
                        requestFieldName(violation.getPropertyPath().toString()),
                        violation.getMessage()
                ))
                .toList();
        return validationResponse(request, fieldErrors);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    ResponseEntity<ApiErrorResponse> handleMethodValidation(
            HandlerMethodValidationException exception,
            HttpServletRequest request
    ) {
        List<ApiFieldError> fieldErrors = exception.getParameterValidationResults().stream()
                .flatMap(result -> result.getResolvableErrors().stream()
                        .map(error -> new ApiFieldError(
                                result.getMethodParameter().getParameterName(),
                                error.getDefaultMessage()
                        )))
                .toList();
        return validationResponse(request, fieldErrors);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException exception,
            HttpServletRequest request
    ) {
        return validationResponse(
                request,
                List.of(new ApiFieldError(exception.getName(), "Value has an invalid type"))
        );
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ApiErrorResponse> handleNoResource(
            NoResourceFoundException exception,
            HttpServletRequest request
    ) {
        return response(
                HttpStatus.NOT_FOUND,
                "RESOURCE_NOT_FOUND",
                "Resource was not found",
                request,
                List.of()
        );
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ApiErrorResponse> handleMethodNotAllowed(
            HttpRequestMethodNotSupportedException exception,
            HttpServletRequest request
    ) {
        return response(
                HttpStatus.METHOD_NOT_ALLOWED,
                "METHOD_NOT_ALLOWED",
                "HTTP method is not supported for this resource",
                request,
                List.of()
        );
    }

    @ExceptionHandler(ApiRequestException.class)
    ResponseEntity<ApiErrorResponse> handleApiRequest(
            ApiRequestException exception,
            HttpServletRequest request
    ) {
        return response(
                exception.getStatus(),
                exception.getCode(),
                exception.getMessage(),
                request,
                List.of()
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiErrorResponse> handleConflict(
            DataIntegrityViolationException exception,
            HttpServletRequest request
    ) {
        LOGGER.warn("Database constraint rejected request for {}", request.getRequestURI());
        return response(
                HttpStatus.CONFLICT,
                "RESOURCE_CONFLICT",
                "The requested change conflicts with existing data",
                request,
                List.of()
        );
    }

    @ExceptionHandler({MaxUploadSizeExceededException.class, MultipartException.class})
    ResponseEntity<ApiErrorResponse> handleMultipart(Exception exception, HttpServletRequest request) {
        return response(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "MEDIA_MULTIPART_LIMIT_EXCEEDED",
                "The uploaded file exceeds the request limit",
                request,
                List.of()
        );
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
        LOGGER.error("Unhandled API exception for {}", request.getRequestURI(), exception);
        return response(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                "An unexpected error occurred",
                request,
                List.of()
        );
    }

    private ResponseEntity<ApiErrorResponse> validationResponse(
            HttpServletRequest request,
            List<ApiFieldError> fieldErrors
    ) {
        return response(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                "Request validation failed",
                request,
                fieldErrors
        );
    }

    private ResponseEntity<ApiErrorResponse> response(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request,
            List<ApiFieldError> fieldErrors
    ) {
        ApiError error = new ApiError(
                code,
                message,
                request.getRequestURI(),
                Instant.now(),
                fieldErrors
        );
        return ResponseEntity.status(status).body(new ApiErrorResponse(error));
    }

    private String requestFieldName(String propertyPath) {
        int separatorIndex = propertyPath.lastIndexOf('.');
        return separatorIndex >= 0 ? propertyPath.substring(separatorIndex + 1) : propertyPath;
    }
}
