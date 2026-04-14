package com.smartcampus.operationshub.dto.resource;

import com.smartcampus.operationshub.domain.ResourceStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateResourceStatusRequest(@NotNull ResourceStatus status) {
}
