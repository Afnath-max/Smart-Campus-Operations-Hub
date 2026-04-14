package com.smartcampus.operationshub.dto.notification;

public record NotificationPreferencesResponse(
        boolean bookingUpdatesEnabled,
        boolean ticketAssignmentEnabled,
        boolean ticketStatusEnabled,
        boolean ticketCommentEnabled) {
}
