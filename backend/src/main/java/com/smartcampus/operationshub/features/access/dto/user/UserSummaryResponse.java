package com.smartcampus.operationshub.features.access.dto.user;

import com.smartcampus.operationshub.domain.AccountStatus;
import com.smartcampus.operationshub.domain.AuthProviderType;
import com.smartcampus.operationshub.domain.UserRole;
import java.util.UUID;

public record UserSummaryResponse(
        UUID id,
        String campusId,
        String email,
        String fullName,
        UserRole role,
        AccountStatus accountStatus,
        AuthProviderType authProviderType,
        boolean googleLinked,
        String profileImageUrl) {
}

