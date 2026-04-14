package com.smartcampus.operationshub.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Id
    private UUID id;

    @Column(name = "campus_id", nullable = false, unique = true, length = 40)
    private String campusId;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false, length = 20)
    private AccountStatus accountStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider_type", nullable = false, length = 20)
    private AuthProviderType authProviderType;

    @Column(name = "google_id", unique = true, length = 255)
    private String googleId;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @PrePersist
    void initializeId() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }

    public UUID getId() {
        return id;
    }

    public String getCampusId() {
        return campusId;
    }

    public void setCampusId(String campusId) {
        this.campusId = normalize(campusId);
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = normalize(email);
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName == null ? null : fullName.trim();
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public AccountStatus getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(AccountStatus accountStatus) {
        this.accountStatus = accountStatus;
    }

    public AuthProviderType getAuthProviderType() {
        return authProviderType;
    }

    public void setAuthProviderType(AuthProviderType authProviderType) {
        this.authProviderType = authProviderType;
    }

    public String getGoogleId() {
        return googleId;
    }

    public void setGoogleId(String googleId) {
        this.googleId = normalize(googleId);
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl == null ? null : profileImageUrl.trim();
    }

    public boolean isActive() {
        return accountStatus == AccountStatus.ACTIVE;
    }

    public boolean supportsLocalLogin() {
        return authProviderType != null && authProviderType.supportsLocal();
    }

    public boolean supportsGoogleLogin() {
        return authProviderType != null && authProviderType.supportsGoogle();
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }
}
