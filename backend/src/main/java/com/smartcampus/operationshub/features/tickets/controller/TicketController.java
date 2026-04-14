package com.smartcampus.operationshub.features.tickets.controller;

import com.smartcampus.operationshub.features.tickets.dto.ticket.CreateTicketCommentRequest;
import com.smartcampus.operationshub.features.tickets.dto.ticket.CreateTicketRequest;
import com.smartcampus.operationshub.features.tickets.dto.ticket.TicketCommentResponse;
import com.smartcampus.operationshub.features.tickets.dto.ticket.TicketImageContent;
import com.smartcampus.operationshub.features.tickets.dto.ticket.TicketImageResponse;
import com.smartcampus.operationshub.features.tickets.dto.ticket.TicketResponse;
import com.smartcampus.operationshub.features.tickets.dto.ticket.UpdateTicketStatusRequest;
import com.smartcampus.operationshub.security.UserPrincipal;
import com.smartcampus.operationshub.features.tickets.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<TicketResponse> createTicket(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestPart("ticket") CreateTicketRequest request,
            @RequestPart(name = "images", required = false) List<MultipartFile> images) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.createTicket(principal, request, images));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<TicketResponse>> getMyTickets(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ticketService.getMyTickets(principal));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicket(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ticketService.getTicket(id, principal));
    }

    @GetMapping("/{id}/images")
    public ResponseEntity<List<TicketImageResponse>> getTicketImages(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ticketService.getTicketImages(id, principal));
    }

    @GetMapping("/images/{imageId}/content")
    public ResponseEntity<org.springframework.core.io.Resource> getTicketImageContent(
            @PathVariable UUID imageId, @AuthenticationPrincipal UserPrincipal principal) {
        TicketImageContent content = ticketService.getTicketImageContent(imageId, principal);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(content.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + content.fileName() + "\"")
                .body(content.resource());
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<TicketCommentResponse>> getComments(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ticketService.getComments(id, principal));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketCommentResponse> addComment(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateTicketCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.addComment(id, principal, request));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<TicketResponse> updateTicketStatus(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateTicketStatusRequest request) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(id, principal, request));
    }
}

