package com.smartcampus.operationshub.features.access.dto.auth;

import com.smartcampus.operationshub.features.access.dto.user.UserSummaryResponse;

public record AuthSessionResponse(UserSummaryResponse user, String redirectTo) {
}

