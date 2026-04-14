package com.smartcampus.operationshub.features.notifications.dto.notification;

import com.smartcampus.operationshub.domain.NotificationType;
import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String message,
        String link,
        boolean read,
        Instant readAt,
        Instant createdAt) {
}

