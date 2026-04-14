package com.smartcampus.operationshub.dto.resource;

import com.smartcampus.operationshub.domain.ResourceStatus;
import com.smartcampus.operationshub.domain.ResourceType;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalTime;

public record UpsertResourceRequest(
        @NotBlank @Size(min = 3, max = 100) String name,
        @NotNull ResourceType type,
        @Size(max = 1000) String description,
        @Min(1) int capacity,
        @NotBlank @Size(max = 160) String location,
        @NotNull LocalTime availableFrom,
        @NotNull LocalTime availableTo,
        @NotNull ResourceStatus status) {

    @AssertTrue(message = "availableFrom must be before availableTo")
    public boolean isAvailabilityWindowValid() {
        return availableFrom != null && availableTo != null && availableFrom.isBefore(availableTo);
    }
}
