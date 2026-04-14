package com.smartcampus.operationshub.features.tickets.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateResolutionRequest(@NotBlank @Size(max = 2000) String resolutionNotes) {
}

