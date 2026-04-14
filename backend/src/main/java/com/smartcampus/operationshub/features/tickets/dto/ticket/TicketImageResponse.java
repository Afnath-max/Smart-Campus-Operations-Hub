package com.smartcampus.operationshub.dto.ticket;

import java.time.Instant;
import java.util.UUID;

public record TicketImageResponse(
        UUID id,
        String fileName,
        String contentType,
        long sizeBytes,
        String contentUrl,
        Instant createdAt) {
}
