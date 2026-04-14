package com.smartcampus.operationshub.controller;

import com.smartcampus.operationshub.domain.BookingStatus;
import com.smartcampus.operationshub.dto.booking.BookingAvailabilityResponse;
import com.smartcampus.operationshub.dto.booking.BookingDecisionRequest;
import com.smartcampus.operationshub.dto.booking.BookingResponse;
import com.smartcampus.operationshub.dto.booking.CancelBookingRequest;
import com.smartcampus.operationshub.dto.booking.CreateBookingRequest;
import com.smartcampus.operationshub.security.UserPrincipal;
import com.smartcampus.operationshub.service.BookingService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/api/bookings/check")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<BookingAvailabilityResponse> checkAvailability(
            @Valid @ModelAttribute CreateBookingRequest request) {
        return ResponseEntity.ok(bookingService.checkAvailability(request));
    }

    @PostMapping("/api/bookings")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<BookingResponse> createBooking(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateBookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(principal, request));
    }

    @GetMapping("/api/bookings/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<BookingResponse>> getMyBookings(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(bookingService.getMyBookings(principal));
    }

    @GetMapping("/api/bookings/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<BookingResponse> getBooking(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(bookingService.getBooking(id, principal));
    }

    @GetMapping(value = "/api/bookings/{id}/qr", produces = "image/svg+xml")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<String> getBookingQrCode(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(bookingService.getBookingQrCode(id, principal));
    }

    @PutMapping("/api/bookings/{id}/cancel")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<BookingResponse> cancelOwnBooking(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody(required = false) CancelBookingRequest request) {
        return ResponseEntity.ok(bookingService.cancelOwnBooking(id, principal, request));
    }

    @GetMapping("/api/admin/bookings")
    public ResponseEntity<List<BookingResponse>> getAdminBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) UUID resourceId,
            @RequestParam(required = false) UUID userId) {
        return ResponseEntity.ok(bookingService.getAdminBookings(status, resourceId, userId));
    }

    @PutMapping("/api/admin/bookings/{id}/approve")
    public ResponseEntity<BookingResponse> approveBooking(@PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.approveBooking(id));
    }

    @PutMapping("/api/admin/bookings/{id}/reject")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable UUID id, @Valid @RequestBody BookingDecisionRequest request) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, request));
    }

    @PutMapping("/api/admin/bookings/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBookingAsAdmin(
            @PathVariable UUID id, @Valid @RequestBody BookingDecisionRequest request) {
        return ResponseEntity.ok(bookingService.cancelBookingAsAdmin(id, request));
    }

    @DeleteMapping("/api/admin/bookings/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable UUID id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }
}
