package com.smartcampus.operationshub.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTicketCommentRequest(@NotBlank @Size(max = 1500) String content) {
}
