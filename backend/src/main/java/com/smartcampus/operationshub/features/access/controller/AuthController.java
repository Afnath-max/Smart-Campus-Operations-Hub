package com.smartcampus.operationshub.features.access.controller;

import com.smartcampus.operationshub.features.access.dto.auth.AuthSessionResponse;
import com.smartcampus.operationshub.features.access.dto.auth.LinkGoogleStartResponse;
import com.smartcampus.operationshub.features.access.dto.auth.LoginRequest;
import com.smartcampus.operationshub.features.access.dto.auth.RegisterRequest;
import com.smartcampus.operationshub.security.UserPrincipal;
import com.smartcampus.operationshub.features.access.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthSessionResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        return ResponseEntity.ok(authService.login(request, servletRequest, servletResponse));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthSessionResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request, servletRequest, servletResponse));
    }

    @GetMapping("/google/authorization-url")
    public ResponseEntity<LinkGoogleStartResponse> googleAuthorizationUrl() {
        return ResponseEntity.ok(authService.googleAuthorizationUrl());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
        authService.logout(authentication, request, response);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/link-google")
    public ResponseEntity<LinkGoogleStartResponse> linkGoogle(
            @AuthenticationPrincipal UserPrincipal principal, HttpSession session) {
        return ResponseEntity.ok(authService.beginGoogleLink(principal, session));
    }
}

