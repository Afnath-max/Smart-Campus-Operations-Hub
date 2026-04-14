CREATE TABLE tickets (
    id UUID PRIMARY KEY,
    resource_id UUID,
    reporter_id UUID NOT NULL,
    assigned_technician_id UUID,
    category VARCHAR(20) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    preferred_contact VARCHAR(160) NOT NULL,
    status VARCHAR(20) NOT NULL,
    resolution_notes VARCHAR(2000),
    rejection_reason VARCHAR(1000),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_tickets_resource FOREIGN KEY (resource_id) REFERENCES resources (id),
    CONSTRAINT fk_tickets_reporter FOREIGN KEY (reporter_id) REFERENCES users (id),
    CONSTRAINT fk_tickets_technician FOREIGN KEY (assigned_technician_id) REFERENCES users (id)
);

CREATE TABLE ticket_images (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    content_type VARCHAR(120) NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_ticket_images_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id),
    CONSTRAINT chk_ticket_images_size CHECK (size_bytes >= 0)
);

CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL,
    author_id UUID NOT NULL,
    content VARCHAR(1500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_ticket_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id),
    CONSTRAINT fk_ticket_comments_author FOREIGN KEY (author_id) REFERENCES users (id)
);

CREATE INDEX idx_tickets_reporter ON tickets (reporter_id);
CREATE INDEX idx_tickets_assigned_technician ON tickets (assigned_technician_id);
CREATE INDEX idx_tickets_status ON tickets (status);
CREATE INDEX idx_tickets_priority ON tickets (priority);
CREATE INDEX idx_ticket_images_ticket ON ticket_images (ticket_id);
CREATE INDEX idx_ticket_comments_ticket ON ticket_comments (ticket_id);
