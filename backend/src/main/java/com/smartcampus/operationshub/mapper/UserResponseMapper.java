package com.smartcampus.operationshub.mapper;

import com.smartcampus.operationshub.domain.Invitation;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.dto.user.InvitationResponse;
import com.smartcampus.operationshub.dto.user.UserDetailResponse;
import com.smartcampus.operationshub.dto.user.UserSummaryResponse;
import com.smartcampus.operationshub.security.UserPrincipal;

public final class UserResponseMapper {

    private UserResponseMapper() {
    }

    public static UserSummaryResponse toSummary(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getCampusId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getAccountStatus(),
                user.getAuthProviderType(),
                user.getGoogleId() != null && !user.getGoogleId().isBlank(),
                user.getProfileImageUrl());
    }

    public static UserSummaryResponse toSummary(UserPrincipal principal) {
        return new UserSummaryResponse(
                principal.id(),
                principal.campusId(),
                principal.email(),
                principal.fullName(),
                principal.role(),
                principal.accountStatus(),
                principal.authProviderType(),
                principal.googleLinked(),
                principal.profileImageUrl());
    }

    public static UserDetailResponse toDetail(User user) {
        return new UserDetailResponse(
                user.getId(),
                user.getCampusId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getAccountStatus(),
                user.getAuthProviderType(),
                user.getGoogleId() != null && !user.getGoogleId().isBlank(),
                user.getProfileImageUrl(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }

    public static InvitationResponse toInvitation(Invitation invitation, String inviteUrl) {
        return new InvitationResponse(
                invitation.getId(),
                invitation.getInviteeEmail(),
                invitation.getInvitedRole(),
                invitation.getInvitationStatus(),
                invitation.getInviteToken(),
                inviteUrl,
                invitation.getExpiresAt(),
                invitation.getCreatedAt());
    }
}
