package com.smartcampus.operationshub.service;

import com.smartcampus.operationshub.domain.Booking;
import com.smartcampus.operationshub.domain.BookingStatus;
import com.smartcampus.operationshub.domain.NotificationType;
import com.smartcampus.operationshub.domain.Resource;
import com.smartcampus.operationshub.domain.ResourceStatus;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import com.smartcampus.operationshub.dto.booking.BookingAvailabilityResponse;
import com.smartcampus.operationshub.dto.booking.BookingDecisionRequest;
import com.smartcampus.operationshub.dto.booking.BookingResponse;
import com.smartcampus.operationshub.dto.booking.CancelBookingRequest;
import com.smartcampus.operationshub.dto.booking.CreateBookingRequest;
import com.smartcampus.operationshub.exception.BadRequestException;
import com.smartcampus.operationshub.exception.ConflictException;
import com.smartcampus.operationshub.exception.ForbiddenException;
import com.smartcampus.operationshub.exception.NotFoundException;
import com.smartcampus.operationshub.repository.BookingRepository;
import com.smartcampus.operationshub.repository.ResourceRepository;
import com.smartcampus.operationshub.repository.UserRepository;
import com.smartcampus.operationshub.security.UserPrincipal;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

    private static final EnumSet<BookingStatus> CONFLICT_BLOCKING_STATUSES =
            EnumSet.of(BookingStatus.PENDING, BookingStatus.APPROVED);

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final QrCodeService qrCodeService;

    public BookingService(
            BookingRepository bookingRepository,
            ResourceRepository resourceRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            QrCodeService qrCodeService) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.qrCodeService = qrCodeService;
    }

    @Transactional(readOnly = true)
    public BookingAvailabilityResponse checkAvailability(CreateBookingRequest request) {
        Resource resource = getResource(request.resourceId());
        validateBookingAgainstResource(resource, request);
        boolean conflict = bookingRepository.existsConflict(
                resource.getId(),
                request.bookingDate(),
                request.startTime(),
                request.endTime(),
                CONFLICT_BLOCKING_STATUSES,
                null);
        return conflict
                ? new BookingAvailabilityResponse(false, "That resource already has a booking in the requested time window.")
                : new BookingAvailabilityResponse(true, "The requested slot is currently available.");
    }

    @Transactional
    public BookingResponse createBooking(UserPrincipal principal, CreateBookingRequest request) {
        Resource resource = getLockedResource(request.resourceId());
        validateBookingAgainstResource(resource, request);
        ensureNoConflict(resource.getId(), request, null);

        User user = userRepository.findById(principal.id())
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));

        Booking booking = new Booking();
        booking.setResource(resource);
        booking.setUser(user);
        booking.setBookingDate(request.bookingDate());
        booking.setStartTime(request.startTime());
        booking.setEndTime(request.endTime());
        booking.setPurpose(request.purpose());
        booking.setExpectedAttendees(request.expectedAttendees());
        booking.setStatus(BookingStatus.PENDING);
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(UserPrincipal principal) {
        return bookingRepository.findAllByUserIdOrderByBookingDateDescStartTimeDesc(principal.id())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BookingResponse getBooking(UUID id, UserPrincipal principal) {
        return toResponse(getAccessibleBookingEntity(id, principal));
    }

    @Transactional(readOnly = true)
    public String getBookingQrCode(UUID id, UserPrincipal principal) {
        Booking booking = getAccessibleBookingEntity(id, principal);
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new BadRequestException("BOOKING_QR_NOT_AVAILABLE", "QR codes are available only for approved bookings");
        }
        return qrCodeService.generateSvg(buildBookingQrPayload(booking));
    }

    @Transactional
    public BookingResponse cancelOwnBooking(UUID id, UserPrincipal principal, CancelBookingRequest request) {
        Booking booking = bookingRepository.findByIdAndUserId(id, principal.id())
                .orElseThrow(() -> new NotFoundException("BOOKING_NOT_FOUND", "Booking not found"));
        if (!(booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.APPROVED)) {
            throw new BadRequestException("BOOKING_CANNOT_BE_CANCELLED", "Only pending or approved bookings can be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setStatusReason(request == null ? null : request.reason());
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAdminBookings(BookingStatus status, UUID resourceId, UUID userId) {
        Specification<Booking> specification = (root, query, builder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (resourceId != null) {
                predicates.add(builder.equal(root.get("resource").get("id"), resourceId));
            }
            if (userId != null) {
                predicates.add(builder.equal(root.get("user").get("id"), userId));
            }
            return builder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };

        Sort sort = Sort.by(
                Sort.Order.desc("bookingDate"),
                Sort.Order.desc("startTime"),
                Sort.Order.desc("createdAt"));

        return bookingRepository.findAll(specification, sort).stream().map(this::toResponse).toList();
    }

    @Transactional
    public BookingResponse approveBooking(UUID id) {
        Booking booking = getBookingEntity(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("BOOKING_NOT_PENDING", "Only pending bookings can be approved");
        }

        Resource resource = getLockedResource(booking.getResource().getId());
        validateBookingAgainstResource(
                resource,
                new CreateBookingRequest(
                        resource.getId(),
                        booking.getBookingDate(),
                        booking.getStartTime(),
                        booking.getEndTime(),
                        booking.getPurpose(),
                        booking.getExpectedAttendees()));
        ensureNoConflict(
                resource.getId(),
                new CreateBookingRequest(
                        resource.getId(),
                        booking.getBookingDate(),
                        booking.getStartTime(),
                        booking.getEndTime(),
                        booking.getPurpose(),
                        booking.getExpectedAttendees()),
                booking.getId());

        booking.setStatus(BookingStatus.APPROVED);
        booking.setStatusReason(null);
        Booking savedBooking = bookingRepository.save(booking);
        notificationService.createWorkflowNotification(
                savedBooking.getUser(),
                null,
                NotificationType.BOOKING_APPROVED,
                "booking-" + savedBooking.getId() + "-approved",
                "Booking approved",
                savedBooking.getResource().getName() + " was approved and is now confirmed in your booking list.",
                "/bookings/my");
        return toResponse(savedBooking);
    }

    @Transactional
    public BookingResponse rejectBooking(UUID id, BookingDecisionRequest request) {
        Booking booking = getBookingEntity(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("BOOKING_NOT_PENDING", "Only pending bookings can be rejected");
        }
        booking.setStatus(BookingStatus.REJECTED);
        booking.setStatusReason(request.reason());
        Booking savedBooking = bookingRepository.save(booking);
        notificationService.createWorkflowNotification(
                savedBooking.getUser(),
                null,
                NotificationType.BOOKING_REJECTED,
                "booking-" + savedBooking.getId() + "-rejected",
                "Booking rejected",
                savedBooking.getResource().getName() + " was rejected. Reason: " + savedBooking.getStatusReason(),
                "/bookings/my");
        return toResponse(savedBooking);
    }

    @Transactional
    public BookingResponse cancelBookingAsAdmin(UUID id, BookingDecisionRequest request) {
        Booking booking = getBookingEntity(id);
        if (!(booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.APPROVED)) {
            throw new BadRequestException("BOOKING_CANNOT_BE_CANCELLED", "Only pending or approved bookings can be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setStatusReason(request.reason());
        Booking savedBooking = bookingRepository.save(booking);
        notificationService.createWorkflowNotification(
                savedBooking.getUser(),
                null,
                NotificationType.BOOKING_CANCELLED,
                "booking-" + savedBooking.getId() + "-cancelled",
                "Booking cancelled",
                savedBooking.getResource().getName() + " was cancelled by an administrator. Reason: "
                        + savedBooking.getStatusReason(),
                "/bookings/my");
        return toResponse(savedBooking);
    }

    @Transactional
    public void deleteBooking(UUID id) {
        bookingRepository.delete(getBookingEntity(id));
    }

    private Booking getBookingEntity(UUID id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("BOOKING_NOT_FOUND", "Booking not found"));
    }

    private Booking getAccessibleBookingEntity(UUID id, UserPrincipal principal) {
        return principal.role() == UserRole.ADMIN
                ? getBookingEntity(id)
                : bookingRepository.findByIdAndUserId(id, principal.id())
                        .orElseThrow(() -> new NotFoundException("BOOKING_NOT_FOUND", "Booking not found"));
    }

    private Resource getResource(UUID id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("RESOURCE_NOT_FOUND", "Resource not found"));
    }

    @Transactional
    protected Resource getLockedResource(UUID id) {
        return resourceRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("RESOURCE_NOT_FOUND", "Resource not found"));
    }

    private void validateBookingAgainstResource(Resource resource, CreateBookingRequest request) {
        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new BadRequestException("RESOURCE_UNAVAILABLE", "Only active resources can be booked");
        }
        if (request.expectedAttendees() > resource.getCapacity()) {
            throw new BadRequestException(
                    "CAPACITY_EXCEEDED",
                    "Expected attendees exceed the resource capacity");
        }
        if (request.startTime().isBefore(resource.getAvailableFrom()) || request.endTime().isAfter(resource.getAvailableTo())) {
            throw new BadRequestException(
                    "OUTSIDE_AVAILABILITY_WINDOW",
                    "The booking request must fit inside the resource availability window");
        }
    }

    private void ensureNoConflict(UUID resourceId, CreateBookingRequest request, UUID excludedBookingId) {
        boolean conflict = bookingRepository.existsConflict(
                resourceId,
                request.bookingDate(),
                request.startTime(),
                request.endTime(),
                CONFLICT_BLOCKING_STATUSES,
                excludedBookingId);
        if (conflict) {
            throw new ConflictException("BOOKING_CONFLICT", "That resource already has a booking in the requested time window");
        }
    }

    private BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getResource().getId(),
                booking.getResource().getName(),
                booking.getUser().getId(),
                booking.getUser().getFullName(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getPurpose(),
                booking.getExpectedAttendees(),
                booking.getStatus(),
                booking.getStatusReason(),
                booking.getCreatedAt(),
                booking.getUpdatedAt());
    }

    private String buildBookingQrPayload(Booking booking) {
        return """
                SMART CAMPUS OPERATIONS HUB
                BOOKING_ID: %s
                RESOURCE: %s
                DATE: %s
                TIME: %s - %s
                PURPOSE: %s
                ATTENDEES: %s
                STATUS: %s
                """
                .formatted(
                        booking.getId(),
                        booking.getResource().getName(),
                        booking.getBookingDate(),
                        booking.getStartTime(),
                        booking.getEndTime(),
                        booking.getPurpose(),
                        booking.getExpectedAttendees(),
                        booking.getStatus());
    }
}
