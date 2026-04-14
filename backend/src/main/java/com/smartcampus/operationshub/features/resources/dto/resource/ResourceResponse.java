package com.smartcampus.operationshub.dto.resource;

import com.smartcampus.operationshub.domain.ResourceStatus;
import com.smartcampus.operationshub.domain.ResourceType;
import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

public record ResourceResponse(
        UUID id,
        String name,
        ResourceType type,
        String description,
        int capacity,
        String location,
        LocalTime availableFrom,
        LocalTime availableTo,
        ResourceStatus status,
        Instant createdAt,
        Instant updatedAt) {
}
