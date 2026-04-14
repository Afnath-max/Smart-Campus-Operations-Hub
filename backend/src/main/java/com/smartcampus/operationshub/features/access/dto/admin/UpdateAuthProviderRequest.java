package com.smartcampus.operationshub.dto.admin;

import com.smartcampus.operationshub.domain.AuthProviderType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateAuthProviderRequest(
        @NotNull AuthProviderType authProviderType,
        @Size(min = 8, max = 120) String initialPassword) {
}
