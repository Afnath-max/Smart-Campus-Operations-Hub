package com.smartcampus.operationshub.features.tickets.dto.ticket;

import com.smartcampus.operationshub.domain.TicketStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateTicketStatusRequest(@NotNull TicketStatus status) {
}

