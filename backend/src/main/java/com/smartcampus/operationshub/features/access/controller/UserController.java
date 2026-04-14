package com.smartcampus.operationshub.controller;

import com.smartcampus.operationshub.dto.user.UserSummaryResponse;
import com.smartcampus.operationshub.security.UserPrincipal;
import com.smartcampus.operationshub.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserSummaryResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(authService.currentUser(principal));
    }
}
