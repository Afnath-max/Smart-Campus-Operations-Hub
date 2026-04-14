package com.smartcampus.operationshub.repository;

import com.smartcampus.operationshub.domain.Notification;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    long countByUserIdAndReadAtIsNull(UUID userId);

    Optional<Notification> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserIdAndDedupeKey(UUID userId, String dedupeKey);

    @Modifying
    @Query("update Notification n set n.readAt = :readAt where n.user.id = :userId and n.readAt is null")
    int markAllAsRead(UUID userId, java.time.Instant readAt);
}
