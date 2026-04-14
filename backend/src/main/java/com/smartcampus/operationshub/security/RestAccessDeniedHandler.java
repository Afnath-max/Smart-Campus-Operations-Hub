package com.smartcampus.operationshub.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.operationshub.dto.ApiErrorResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public RestAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(
            HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException)
            throws IOException, ServletException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(
                response.getOutputStream(),
                new ApiErrorResponse(
                        Instant.now(),
                        HttpStatus.FORBIDDEN.value(),
                        HttpStatus.FORBIDDEN.getReasonPhrase(),
                        "FORBIDDEN",
                        "You are not allowed to access this resource",
                        request.getRequestURI(),
                        Map.of()));
    }
}
