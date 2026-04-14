package com.smartcampus.operationshub.features.tickets.dto.ticket;

import com.smartcampus.operationshub.domain.UserRole;
import java.time.Instant;
import java.util.UUID;

public record TicketCommentResponse(
        UUID id,
        UUID ticketId,
        UUID authorId,
        String authorName,
        UserRole authorRole,
        String content,
        boolean editable,
        Instant createdAt,
        Instant updatedAt) {
}

