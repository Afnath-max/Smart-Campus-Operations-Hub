package com.smartcampus.operationshub.features.notifications.service;

import com.smartcampus.operationshub.domain.Notification;
import com.smartcampus.operationshub.domain.NotificationPreference;
import com.smartcampus.operationshub.domain.NotificationType;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.features.notifications.dto.notification.NotificationPreferencesResponse;
import com.smartcampus.operationshub.features.notifications.dto.notification.NotificationResponse;
import com.smartcampus.operationshub.features.notifications.dto.notification.UnreadCountResponse;
import com.smartcampus.operationshub.features.notifications.dto.notification.UpdateNotificationPreferencesRequest;
import com.smartcampus.operationshub.exception.NotFoundException;
import com.smartcampus.operationshub.features.notifications.repository.NotificationPreferenceRepository;
import com.smartcampus.operationshub.features.notifications.repository.NotificationRepository;
import com.smartcampus.operationshub.features.access.repository.UserRepository;
import com.smartcampus.operationshub.security.UserPrincipal;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final UserRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            NotificationPreferenceRepository notificationPreferenceRepository,
            UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.notificationPreferenceRepository = notificationPreferenceRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(UserPrincipal principal) {
        return notificationRepository.findAllByUserIdOrderByCreatedAtDesc(principal.id()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(UserPrincipal principal) {
        return new UnreadCountResponse(notificationRepository.countByUserIdAndReadAtIsNull(principal.id()));
    }

    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, UserPrincipal principal) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, principal.id())
                .orElseThrow(() -> new NotFoundException("NOTIFICATION_NOT_FOUND", "Notification not found"));
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
        }
        return toResponse(notificationRepository.save(notification));
    }

    @Transactional
    public UnreadCountResponse markAllAsRead(UserPrincipal principal) {
        notificationRepository.markAllAsRead(principal.id(), Instant.now());
        return getUnreadCount(principal);
    }

    @Transactional
    public void deleteNotification(UUID notificationId, UserPrincipal principal) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, principal.id())
                .orElseThrow(() -> new NotFoundException("NOTIFICATION_NOT_FOUND", "Notification not found"));
        notificationRepository.delete(notification);
    }

    @Transactional(readOnly = true)
    public NotificationPreferencesResponse getPreferences(UserPrincipal principal) {
        return toPreferencesResponse(getOrCreatePreferencesEntity(principal.id()));
    }

    @Transactional
    public NotificationPreferencesResponse updatePreferences(
            UserPrincipal principal, UpdateNotificationPreferencesRequest request) {
        NotificationPreference preference = getOrCreatePreferencesEntity(principal.id());
        preference.setBookingUpdatesEnabled(request.bookingUpdatesEnabled());
        preference.setTicketAssignmentEnabled(request.ticketAssignmentEnabled());
        preference.setTicketStatusEnabled(request.ticketStatusEnabled());
        preference.setTicketCommentEnabled(request.ticketCommentEnabled());
        return toPreferencesResponse(notificationPreferenceRepository.save(preference));
    }

    @Transactional
    public void createWorkflowNotification(
            User recipient,
            UUID actorUserId,
            NotificationType type,
            String dedupeKey,
            String title,
            String message,
            String link) {
        if (recipient == null) {
            return;
        }

        if (actorUserId != null && Objects.equals(recipient.getId(), actorUserId)) {
            return;
        }

        if (!isNotificationEnabled(recipient, type)) {
            return;
        }

        if (dedupeKey != null && notificationRepository.existsByUserIdAndDedupeKey(recipient.getId(), dedupeKey)) {
            return;
        }

        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setLink(link);
        notification.setDedupeKey(dedupeKey);
        notificationRepository.save(notification);
    }

    private NotificationPreference getOrCreatePreferencesEntity(UUID userId) {
        return notificationPreferenceRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));
            NotificationPreference preference = new NotificationPreference();
            preference.setUser(user);
            return notificationPreferenceRepository.save(preference);
        });
    }

    private boolean isNotificationEnabled(User recipient, NotificationType type) {
        NotificationPreference preference = getOrCreatePreferencesEntity(recipient.getId());
        return switch (type) {
            case BOOKING_APPROVED, BOOKING_REJECTED, BOOKING_CANCELLED -> preference.isBookingUpdatesEnabled();
            case TICKET_ASSIGNED -> preference.isTicketAssignmentEnabled();
            case TICKET_STATUS_CHANGED -> preference.isTicketStatusEnabled();
            case TICKET_COMMENT -> preference.isTicketCommentEnabled();
        };
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getLink(),
                notification.getReadAt() != null,
                notification.getReadAt(),
                notification.getCreatedAt());
    }

    private NotificationPreferencesResponse toPreferencesResponse(NotificationPreference preference) {
        return new NotificationPreferencesResponse(
                preference.isBookingUpdatesEnabled(),
                preference.isTicketAssignmentEnabled(),
                preference.isTicketStatusEnabled(),
                preference.isTicketCommentEnabled());
    }
}

