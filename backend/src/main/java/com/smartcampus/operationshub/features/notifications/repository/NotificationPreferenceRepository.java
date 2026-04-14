package com.smartcampus.operationshub.repository;

import com.smartcampus.operationshub.domain.NotificationPreference;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, UUID> {

    Optional<NotificationPreference> findByUserId(UUID userId);
}
