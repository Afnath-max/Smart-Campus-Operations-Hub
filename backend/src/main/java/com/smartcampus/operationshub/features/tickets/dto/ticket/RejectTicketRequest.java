package com.smartcampus.operationshub.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectTicketRequest(@NotBlank @Size(max = 1000) String reason) {
}
