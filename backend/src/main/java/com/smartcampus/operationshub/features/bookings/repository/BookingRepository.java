package com.smartcampus.operationshub.repository;

import com.smartcampus.operationshub.domain.Booking;
import com.smartcampus.operationshub.domain.BookingStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface BookingRepository extends JpaRepository<Booking, UUID>, JpaSpecificationExecutor<Booking> {

    @Query("""
            select (count(b) > 0) from Booking b
            where b.resource.id = :resourceId
              and b.bookingDate = :bookingDate
              and b.status in :statuses
              and (:excludedBookingId is null or b.id <> :excludedBookingId)
              and b.startTime < :endTime
              and b.endTime > :startTime
            """)
    boolean existsConflict(
            UUID resourceId,
            LocalDate bookingDate,
            LocalTime startTime,
            LocalTime endTime,
            Collection<BookingStatus> statuses,
            UUID excludedBookingId);

    List<Booking> findAllByUserIdOrderByBookingDateDescStartTimeDesc(UUID userId);

    Optional<Booking> findByIdAndUserId(UUID id, UUID userId);
}
