package com.smartcampus.operationshub.dto.user;

import com.smartcampus.operationshub.domain.AccountStatus;
import com.smartcampus.operationshub.domain.AuthProviderType;
import com.smartcampus.operationshub.domain.UserRole;
import java.time.Instant;
import java.util.UUID;

public record UserDetailResponse(
        UUID id,
        String campusId,
        String email,
        String fullName,
        UserRole role,
        AccountStatus accountStatus,
        AuthProviderType authProviderType,
        boolean googleLinked,
        String profileImageUrl,
        Instant createdAt,
        Instant updatedAt) {
}
