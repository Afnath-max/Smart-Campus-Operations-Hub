package com.smartcampus.operationshub.dto.notification;

public record UpdateNotificationPreferencesRequest(
        boolean bookingUpdatesEnabled,
        boolean ticketAssignmentEnabled,
        boolean ticketStatusEnabled,
        boolean ticketCommentEnabled) {
}
