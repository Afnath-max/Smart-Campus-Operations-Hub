package com.smartcampus.operationshub.controller;

import com.smartcampus.operationshub.dto.ticket.TicketCommentResponse;
import com.smartcampus.operationshub.dto.ticket.UpdateTicketCommentRequest;
import com.smartcampus.operationshub.security.UserPrincipal;
import com.smartcampus.operationshub.service.TicketService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final TicketService ticketService;

    public CommentController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<TicketCommentResponse> updateComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateTicketCommentRequest request) {
        return ResponseEntity.ok(ticketService.updateComment(commentId, principal, request));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID commentId, @AuthenticationPrincipal UserPrincipal principal) {
        ticketService.deleteComment(commentId, principal);
        return ResponseEntity.noContent().build();
    }
}
