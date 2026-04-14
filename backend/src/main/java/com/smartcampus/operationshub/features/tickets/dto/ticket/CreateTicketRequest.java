package com.smartcampus.operationshub.features.tickets.dto.ticket;

import com.smartcampus.operationshub.domain.TicketCategory;
import com.smartcampus.operationshub.domain.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateTicketRequest(
        UUID resourceId,
        @NotNull TicketCategory category,
        @NotBlank @Size(min = 20, max = 2000) String description,
        @NotNull TicketPriority priority,
        @NotBlank @Size(max = 160) String preferredContact) {
}

