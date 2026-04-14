package com.smartcampus.operationshub.controller;

import com.smartcampus.operationshub.domain.TicketStatus;
import com.smartcampus.operationshub.dto.ticket.TicketResponse;
import com.smartcampus.operationshub.security.UserPrincipal;
import com.smartcampus.operationshub.service.TicketService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/technician/tickets")
@PreAuthorize("hasRole('TECHNICIAN')")
public class TechnicianTicketController {

    private final TicketService ticketService;

    public TechnicianTicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<TicketResponse>> getAssignedTickets(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) TicketStatus status) {
        return ResponseEntity.ok(ticketService.getAssignedTickets(principal, status));
    }
}
