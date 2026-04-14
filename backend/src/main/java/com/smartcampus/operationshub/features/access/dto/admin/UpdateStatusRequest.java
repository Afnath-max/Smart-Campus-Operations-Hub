package com.smartcampus.operationshub.features.access.dto.admin;

import com.smartcampus.operationshub.domain.AccountStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(@NotNull AccountStatus status) {
}

