package com.smartcampus.operationshub.features.access.repository;

import com.smartcampus.operationshub.domain.Invitation;
import com.smartcampus.operationshub.domain.InvitationStatus;
import com.smartcampus.operationshub.domain.UserRole;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvitationRepository extends JpaRepository<Invitation, UUID> {

    Optional<Invitation> findByInviteToken(String inviteToken);

    boolean existsByInviteeEmailAndInvitationStatusAndInvitedRole(String inviteeEmail, InvitationStatus invitationStatus, UserRole invitedRole);

    List<Invitation> findAllByOrderByCreatedAtDesc();
}

