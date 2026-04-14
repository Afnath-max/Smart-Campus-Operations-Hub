package com.smartcampus.operationshub.features.access.dto.admin;

import com.smartcampus.operationshub.domain.UserRole;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(@NotNull UserRole role) {
}

