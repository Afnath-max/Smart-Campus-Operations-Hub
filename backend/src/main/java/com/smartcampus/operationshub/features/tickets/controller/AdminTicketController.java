package com.smartcampus.operationshub.controller;

import com.smartcampus.operationshub.domain.TicketCategory;
import com.smartcampus.operationshub.domain.TicketPriority;
import com.smartcampus.operationshub.domain.TicketStatus;
import com.smartcampus.operationshub.dto.ticket.AssignTicketRequest;
import com.smartcampus.operationshub.dto.ticket.RejectTicketRequest;
import com.smartcampus.operationshub.dto.ticket.TicketResponse;
import com.smartcampus.operationshub.dto.ticket.UpdateResolutionRequest;
import com.smartcampus.operationshub.dto.ticket.UpdateTicketStatusRequest;
import com.smartcampus.operationshub.security.UserPrincipal;
import com.smartcampus.operationshub.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/tickets")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTicketController {

    private final TicketService ticketService;

    public AdminTicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) TicketCategory category,
            @RequestParam(required = false) UUID assignedTechnicianId) {
        return ResponseEntity.ok(ticketService.getAdminTickets(status, priority, category, assignedTechnicianId));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable UUID id, @Valid @RequestBody AssignTicketRequest request) {
        return ResponseEntity.ok(ticketService.assignTicket(id, request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateTicketStatusRequest request) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(id, principal, request));
    }

    @PutMapping("/{id}/resolution")
    public ResponseEntity<TicketResponse> updateResolution(
            @PathVariable UUID id, @Valid @RequestBody UpdateResolutionRequest request) {
        return ResponseEntity.ok(ticketService.updateResolution(id, request));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<TicketResponse> rejectTicket(
            @PathVariable UUID id, @Valid @RequestBody RejectTicketRequest request) {
        return ResponseEntity.ok(ticketService.rejectTicket(id, request));
    }

    @DeleteMapping("/{ticketId}/images/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable UUID ticketId, @PathVariable UUID imageId) {
        ticketService.deleteImage(ticketId, imageId);
        return ResponseEntity.noContent().build();
    }
}
