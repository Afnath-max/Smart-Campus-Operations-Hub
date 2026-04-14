package com.smartcampus.operationshub.security;

import com.smartcampus.operationshub.domain.AccountStatus;
import com.smartcampus.operationshub.domain.AuthProviderType;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public record UserPrincipal(
        UUID id,
        String campusId,
        String email,
        String fullName,
        UserRole role,
        AccountStatus accountStatus,
        AuthProviderType authProviderType,
        String passwordHash,
        boolean googleLinked,
        String profileImageUrl) implements Serializable {

    public static UserPrincipal fromUser(User user) {
        return new UserPrincipal(
                user.getId(),
                user.getCampusId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getAccountStatus(),
                user.getAuthProviderType(),
                user.getPasswordHash(),
                user.getGoogleId() != null && !user.getGoogleId().isBlank(),
                user.getProfileImageUrl());
    }

    public Collection<? extends GrantedAuthority> authorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
}
