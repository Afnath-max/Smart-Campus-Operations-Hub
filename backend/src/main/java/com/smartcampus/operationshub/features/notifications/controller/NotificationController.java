package com.smartcampus.operationshub.features.notifications.controller;

import com.smartcampus.operationshub.features.notifications.dto.notification.NotificationResponse;
import com.smartcampus.operationshub.features.notifications.dto.notification.UnreadCountResponse;
import com.smartcampus.operationshub.security.UserPrincipal;
import com.smartcampus.operationshub.features.notifications.service.NotificationService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(notificationService.getNotifications(principal));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(notificationService.getUnreadCount(principal));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(notificationService.markAsRead(id, principal));
    }

    @PutMapping("/read-all")
    public ResponseEntity<UnreadCountResponse> markAllAsRead(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(notificationService.markAllAsRead(principal));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.deleteNotification(id, principal);
        return ResponseEntity.noContent().build();
    }
}

