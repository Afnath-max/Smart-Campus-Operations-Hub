package com.smartcampus.operationshub.dto.user;

import com.smartcampus.operationshub.domain.InvitationStatus;
import com.smartcampus.operationshub.domain.UserRole;
import java.time.Instant;
import java.util.UUID;

public record InvitationResponse(
        UUID id,
        String inviteeEmail,
        UserRole invitedRole,
        InvitationStatus invitationStatus,
        String inviteToken,
        String inviteUrl,
        Instant expiresAt,
        Instant createdAt) {
}
