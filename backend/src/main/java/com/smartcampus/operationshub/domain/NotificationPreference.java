package com.smartcampus.operationshub.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreference extends BaseEntity {

    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "booking_updates_enabled", nullable = false)
    private boolean bookingUpdatesEnabled = true;

    @Column(name = "ticket_assignment_enabled", nullable = false)
    private boolean ticketAssignmentEnabled = true;

    @Column(name = "ticket_status_enabled", nullable = false)
    private boolean ticketStatusEnabled = true;

    @Column(name = "ticket_comment_enabled", nullable = false)
    private boolean ticketCommentEnabled = true;

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public boolean isBookingUpdatesEnabled() {
        return bookingUpdatesEnabled;
    }

    public void setBookingUpdatesEnabled(boolean bookingUpdatesEnabled) {
        this.bookingUpdatesEnabled = bookingUpdatesEnabled;
    }

    public boolean isTicketAssignmentEnabled() {
        return ticketAssignmentEnabled;
    }

    public void setTicketAssignmentEnabled(boolean ticketAssignmentEnabled) {
        this.ticketAssignmentEnabled = ticketAssignmentEnabled;
    }

    public boolean isTicketStatusEnabled() {
        return ticketStatusEnabled;
    }

    public void setTicketStatusEnabled(boolean ticketStatusEnabled) {
        this.ticketStatusEnabled = ticketStatusEnabled;
    }

    public boolean isTicketCommentEnabled() {
        return ticketCommentEnabled;
    }

    public void setTicketCommentEnabled(boolean ticketCommentEnabled) {
        this.ticketCommentEnabled = ticketCommentEnabled;
    }
}
