package com.smartcampus.operationshub.dto.booking;

import com.smartcampus.operationshub.domain.BookingStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record BookingResponse(
        UUID id,
        UUID resourceId,
        String resourceName,
        UUID userId,
        String userName,
        LocalDate bookingDate,
        LocalTime startTime,
        LocalTime endTime,
        String purpose,
        int expectedAttendees,
        BookingStatus status,
        String statusReason,
        Instant createdAt,
        Instant updatedAt) {
}
