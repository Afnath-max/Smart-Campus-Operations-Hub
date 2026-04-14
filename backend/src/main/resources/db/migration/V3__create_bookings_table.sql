CREATE TABLE bookings (
    id UUID PRIMARY KEY,
    resource_id UUID NOT NULL,
    user_id UUID NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose VARCHAR(500) NOT NULL,
    expected_attendees INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    status_reason VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_bookings_resource FOREIGN KEY (resource_id) REFERENCES resources (id),
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_bookings_resource_date ON bookings (resource_id, booking_date);
CREATE INDEX idx_bookings_user ON bookings (user_id);
CREATE INDEX idx_bookings_status ON bookings (status);
