package com.smartcampus.operationshub.features.notifications.dto.notification;

public record NotificationPreferencesResponse(
        boolean bookingUpdatesEnabled,
        boolean ticketAssignmentEnabled,
        boolean ticketStatusEnabled,
        boolean ticketCommentEnabled) {
}

