package com.smartcampus.operationshub.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "invitations")
public class Invitation extends BaseEntity {

    @Id
    private UUID id;

    @Column(name = "invitee_email", nullable = false, length = 255)
    private String inviteeEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "invited_role", nullable = false, length = 20)
    private UserRole invitedRole;

    @Column(name = "inviter_user_id", nullable = false)
    private UUID inviterUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "invitation_status", nullable = false, length = 20)
    private InvitationStatus invitationStatus;

    @Column(name = "invite_token", nullable = false, unique = true, length = 120)
    private String inviteToken;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @PrePersist
    void initializeId() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }

    public UUID getId() {
        return id;
    }

    public String getInviteeEmail() {
        return inviteeEmail;
    }

    public void setInviteeEmail(String inviteeEmail) {
        this.inviteeEmail = inviteeEmail == null ? null : inviteeEmail.trim().toLowerCase(Locale.ROOT);
    }

    public UserRole getInvitedRole() {
        return invitedRole;
    }

    public void setInvitedRole(UserRole invitedRole) {
        this.invitedRole = invitedRole;
    }

    public UUID getInviterUserId() {
        return inviterUserId;
    }

    public void setInviterUserId(UUID inviterUserId) {
        this.inviterUserId = inviterUserId;
    }

    public InvitationStatus getInvitationStatus() {
        return invitationStatus;
    }

    public void setInvitationStatus(InvitationStatus invitationStatus) {
        this.invitationStatus = invitationStatus;
    }

    public String getInviteToken() {
        return inviteToken;
    }

    public void setInviteToken(String inviteToken) {
        this.inviteToken = inviteToken;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
}

