package com.smartcampus.operationshub.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BookingDecisionRequest(@NotBlank @Size(max = 500) String reason) {
}
