package com.smartcampus.operationshub.dto.ticket;

import com.smartcampus.operationshub.domain.TicketCategory;
import com.smartcampus.operationshub.domain.TicketPriority;
import com.smartcampus.operationshub.domain.TicketStatus;
import java.time.Instant;
import java.util.UUID;

public record TicketResponse(
        UUID id,
        UUID resourceId,
        String resourceName,
        UUID reporterId,
        String reporterName,
        UUID assignedTechnicianId,
        String assignedTechnicianName,
        TicketCategory category,
        String description,
        TicketPriority priority,
        String preferredContact,
        TicketStatus status,
        String resolutionNotes,
        String rejectionReason,
        long imageCount,
        long commentCount,
        Instant resolvedAt,
        Instant createdAt,
        Instant updatedAt) {
}
