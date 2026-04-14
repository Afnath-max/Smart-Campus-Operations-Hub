CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY,
    booking_updates_enabled BOOLEAN NOT NULL,
    ticket_assignment_enabled BOOLEAN NOT NULL,
    ticket_status_enabled BOOLEAN NOT NULL,
    ticket_comment_enabled BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_notification_preferences_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message VARCHAR(500) NOT NULL,
    link VARCHAR(255),
    dedupe_key VARCHAR(255),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_notifications_user_dedupe
    ON notifications (user_id, dedupe_key);

CREATE INDEX idx_notifications_user_created_at ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_read_at ON notifications (user_id, read_at);
