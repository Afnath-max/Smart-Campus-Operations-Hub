package com.smartcampus.operationshub.controller;

import com.smartcampus.operationshub.dto.notification.NotificationPreferencesResponse;
import com.smartcampus.operationshub.dto.notification.UpdateNotificationPreferencesRequest;
import com.smartcampus.operationshub.security.UserPrincipal;
import com.smartcampus.operationshub.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/preferences/notifications")
public class NotificationPreferenceController {

    private final NotificationService notificationService;

    public NotificationPreferenceController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<NotificationPreferencesResponse> getPreferences(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(notificationService.getPreferences(principal));
    }

    @PutMapping
    public ResponseEntity<NotificationPreferencesResponse> updatePreferences(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateNotificationPreferencesRequest request) {
        return ResponseEntity.ok(notificationService.updatePreferences(principal, request));
    }
}
