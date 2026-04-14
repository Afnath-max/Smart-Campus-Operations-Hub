package com.smartcampus.operationshub.dto.auth;

import com.smartcampus.operationshub.dto.user.UserSummaryResponse;

public record AuthSessionResponse(UserSummaryResponse user, String redirectTo) {
}
