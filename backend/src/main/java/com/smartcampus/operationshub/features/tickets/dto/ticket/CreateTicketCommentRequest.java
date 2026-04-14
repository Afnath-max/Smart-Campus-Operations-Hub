package com.smartcampus.operationshub.features.tickets.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTicketCommentRequest(@NotBlank @Size(max = 1500) String content) {
}

