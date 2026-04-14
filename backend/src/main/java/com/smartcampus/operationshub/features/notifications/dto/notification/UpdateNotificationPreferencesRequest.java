package com.smartcampus.operationshub.features.notifications.dto.notification;

public record UpdateNotificationPreferencesRequest(
        boolean bookingUpdatesEnabled,
        boolean ticketAssignmentEnabled,
        boolean ticketStatusEnabled,
        boolean ticketCommentEnabled) {
}

