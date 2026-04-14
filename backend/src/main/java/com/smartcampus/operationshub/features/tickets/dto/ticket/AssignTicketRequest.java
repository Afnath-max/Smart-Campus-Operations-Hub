package com.smartcampus.operationshub.features.tickets.dto.ticket;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AssignTicketRequest(@NotNull UUID technicianId) {
}

