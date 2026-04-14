package com.smartcampus.operationshub.features.resources.dto.resource;

import com.smartcampus.operationshub.domain.ResourceStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateResourceStatusRequest(@NotNull ResourceStatus status) {
}

