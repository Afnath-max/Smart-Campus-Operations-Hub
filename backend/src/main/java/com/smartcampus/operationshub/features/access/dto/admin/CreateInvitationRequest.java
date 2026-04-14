package com.smartcampus.operationshub.dto.admin;

import com.smartcampus.operationshub.domain.AuthProviderType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateInvitationRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 3, max = 40) String campusId,
        @NotBlank @Size(min = 3, max = 120) String fullName,
        @NotNull AuthProviderType authProviderType,
        @Size(min = 8, max = 120) String initialPassword) {
}
