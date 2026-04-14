package com.smartcampus.operationshub.exception;

import com.smartcampus.operationshub.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException exception, HttpServletRequest request) {
        return buildResponse(
                exception.getStatus(),
                exception.getCode(),
                exception.getMessage(),
                request.getRequestURI(),
                Map.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(
            MethodArgumentNotValidException exception, HttpServletRequest request) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_FAILED",
                "One or more fields failed validation",
                request.getRequestURI(),
                extractFieldErrors(exception.getBindingResult().getFieldErrors()));
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<ApiErrorResponse> handleBindException(BindException exception, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_FAILED",
                "One or more fields failed validation",
                request.getRequestURI(),
                extractFieldErrors(exception.getBindingResult().getFieldErrors()));
    }

    @ExceptionHandler({BadCredentialsException.class, DisabledException.class})
    public ResponseEntity<ApiErrorResponse> handleAuthException(RuntimeException exception, HttpServletRequest request) {
        HttpStatus status = exception instanceof DisabledException ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;
        String code = exception instanceof DisabledException ? "ACCOUNT_DISABLED" : "INVALID_CREDENTIALS";
        String message = exception instanceof DisabledException ? "This account is disabled" : "Invalid credentials";
        return buildResponse(status, code, message, request.getRequestURI(), Map.of());
    }

    @ExceptionHandler({AccessDeniedException.class, AuthorizationDeniedException.class})
    public ResponseEntity<ApiErrorResponse> handleAccessDeniedException(RuntimeException exception, HttpServletRequest request) {
        return buildResponse(
                HttpStatus.FORBIDDEN,
                "ACCESS_DENIED",
                "You do not have permission to perform this action",
                request.getRequestURI(),
                Map.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpectedException(Exception exception, HttpServletRequest request) {
        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred",
                request.getRequestURI(),
                Map.of());
    }

    private ResponseEntity<ApiErrorResponse> buildResponse(
            HttpStatus status, String code, String message, String path, Map<String, String> fieldErrors) {
        return ResponseEntity.status(status)
                .body(new ApiErrorResponse(
                        Instant.now(),
                        status.value(),
                        status.getReasonPhrase(),
                        code,
                        message,
                        path,
                        fieldErrors));
    }

    private Map<String, String> extractFieldErrors(Iterable<FieldError> fieldErrors) {
        Map<String, String> response = new LinkedHashMap<>();
        for (FieldError fieldError : fieldErrors) {
            response.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return response;
    }
}
