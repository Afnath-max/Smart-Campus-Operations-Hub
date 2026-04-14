package com.smartcampus.operationshub.features.tickets.service;

import com.smartcampus.operationshub.domain.AccountStatus;
import com.smartcampus.operationshub.domain.NotificationType;
import com.smartcampus.operationshub.domain.Resource;
import com.smartcampus.operationshub.domain.Ticket;
import com.smartcampus.operationshub.domain.TicketCategory;
import com.smartcampus.operationshub.domain.TicketComment;
import com.smartcampus.operationshub.domain.TicketImage;
import com.smartcampus.operationshub.domain.TicketPriority;
import com.smartcampus.operationshub.domain.TicketStatus;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import com.smartcampus.operationshub.features.tickets.dto.ticket.AssignTicketRequest;
import com.smartcampus.operationshub.features.tickets.dto.ticket.CreateTicketCommentRequest;
import com.smartcampus.operationshub.features.tickets.dto.ticket.CreateTicketRequest;
import com.smartcampus.operationshub.features.tickets.dto.ticket.RejectTicketRequest;
import com.smartcampus.operationshub.features.tickets.dto.ticket.TicketCommentResponse;
import com.smartcampus.operationshub.features.tickets.dto.ticket.TicketImageContent;
import com.smartcampus.operationshub.features.tickets.dto.ticket.TicketImageResponse;
import com.smartcampus.operationshub.features.tickets.dto.ticket.TicketResponse;
import com.smartcampus.operationshub.features.tickets.dto.ticket.UpdateResolutionRequest;
import com.smartcampus.operationshub.features.tickets.dto.ticket.UpdateTicketCommentRequest;
import com.smartcampus.operationshub.features.tickets.dto.ticket.UpdateTicketStatusRequest;
import com.smartcampus.operationshub.exception.BadRequestException;
import com.smartcampus.operationshub.exception.ForbiddenException;
import com.smartcampus.operationshub.exception.NotFoundException;
import com.smartcampus.operationshub.features.notifications.service.NotificationService;
import com.smartcampus.operationshub.features.resources.repository.ResourceRepository;
import com.smartcampus.operationshub.features.tickets.repository.TicketCommentRepository;
import com.smartcampus.operationshub.features.tickets.repository.TicketImageRepository;
import com.smartcampus.operationshub.features.tickets.repository.TicketRepository;
import com.smartcampus.operationshub.features.access.repository.UserRepository;
import com.smartcampus.operationshub.security.UserPrincipal;
import com.smartcampus.operationshub.service.storage.FileStorageService;
import com.smartcampus.operationshub.service.storage.StoredFileDescriptor;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class TicketService {

    private static final int MAX_IMAGE_COUNT = 3;

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final TicketImageRepository ticketImageRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    public TicketService(
            TicketRepository ticketRepository,
            TicketCommentRepository ticketCommentRepository,
            TicketImageRepository ticketImageRepository,
            ResourceRepository resourceRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService,
            NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.ticketCommentRepository = ticketCommentRepository;
        this.ticketImageRepository = ticketImageRepository;
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.notificationService = notificationService;
    }

    @Transactional
    public TicketResponse createTicket(UserPrincipal principal, CreateTicketRequest request, List<MultipartFile> images) {
        User reporter = getUser(principal.id());
        Resource resource = request.resourceId() == null ? null : getResource(request.resourceId());
        List<MultipartFile> normalizedImages = normalizeImages(images);
        validateImages(normalizedImages);

        Ticket ticket = new Ticket();
        ticket.setReporter(reporter);
        ticket.setResource(resource);
        ticket.setCategory(request.category());
        ticket.setDescription(request.description());
        ticket.setPriority(request.priority());
        ticket.setPreferredContact(request.preferredContact());
        ticket.setStatus(TicketStatus.OPEN);
        ticket = ticketRepository.save(ticket);

        storeTicketImages(ticket, normalizedImages);
        return toResponse(ticket);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getMyTickets(UserPrincipal principal) {
        return ticketRepository.findAllByReporterIdOrderByCreatedAtDesc(principal.id()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getAssignedTickets(UserPrincipal principal, TicketStatus status) {
        List<Ticket> tickets = status == null
                ? ticketRepository.findAllByAssignedTechnicianIdOrderByCreatedAtDesc(principal.id())
                : ticketRepository.findAllByAssignedTechnicianIdAndStatusOrderByCreatedAtDesc(principal.id(), status);
        return tickets.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getAdminTickets(
            TicketStatus status,
            TicketPriority priority,
            TicketCategory category,
            UUID assignedTechnicianId) {
        Specification<Ticket> specification = (root, query, builder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(builder.equal(root.get("priority"), priority));
            }
            if (category != null) {
                predicates.add(builder.equal(root.get("category"), category));
            }
            if (assignedTechnicianId != null) {
                predicates.add(builder.equal(root.get("assignedTechnician").get("id"), assignedTechnicianId));
            }
            return builder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };

        return ticketRepository
                .findAll(specification, Sort.by(Sort.Order.desc("createdAt")))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicket(UUID ticketId, UserPrincipal principal) {
        return toResponse(getAccessibleTicket(ticketId, principal));
    }

    @Transactional(readOnly = true)
    public List<TicketImageResponse> getTicketImages(UUID ticketId, UserPrincipal principal) {
        Ticket ticket = getAccessibleTicket(ticketId, principal);
        return ticketImageRepository.findAllByTicketIdOrderByCreatedAtAsc(ticket.getId()).stream()
                .map(this::toImageResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TicketImageContent getTicketImageContent(UUID imageId, UserPrincipal principal) {
        TicketImage image = ticketImageRepository.findById(imageId)
                .orElseThrow(() -> new NotFoundException("IMAGE_NOT_FOUND", "Ticket image not found"));
        ensureTicketAccess(image.getTicket(), principal);
        org.springframework.core.io.Resource resource = fileStorageService.loadAsResource(image.getStoragePath());
        return new TicketImageContent(resource, image.getContentType(), image.getOriginalFileName());
    }

    @Transactional(readOnly = true)
    public List<TicketCommentResponse> getComments(UUID ticketId, UserPrincipal principal) {
        Ticket ticket = getAccessibleTicket(ticketId, principal);
        return ticketCommentRepository.findAllByTicketIdOrderByCreatedAtAsc(ticket.getId()).stream()
                .map(comment -> toCommentResponse(comment, principal.id()))
                .toList();
    }

    @Transactional
    public TicketCommentResponse addComment(
            UUID ticketId, UserPrincipal principal, CreateTicketCommentRequest request) {
        Ticket ticket = getAccessibleTicket(ticketId, principal);
        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setAuthor(getUser(principal.id()));
        comment.setContent(request.content());
        TicketComment savedComment = ticketCommentRepository.save(comment);
        notificationService.createWorkflowNotification(
                ticket.getReporter(),
                principal.id(),
                NotificationType.TICKET_COMMENT,
                "ticket-comment-" + savedComment.getId(),
                "New ticket comment",
                "A new comment was added to ticket " + ticket.getId() + ".",
                "/tickets/" + ticket.getId());
        notificationService.createWorkflowNotification(
                ticket.getAssignedTechnician(),
                principal.id(),
                NotificationType.TICKET_COMMENT,
                "ticket-comment-" + savedComment.getId(),
                "New ticket comment",
                "A new comment was added to ticket " + ticket.getId() + ".",
                "/tickets/" + ticket.getId());
        return toCommentResponse(savedComment, principal.id());
    }

    @Transactional
    public TicketResponse updateTicketStatus(
            UUID ticketId, UserPrincipal principal, UpdateTicketStatusRequest request) {
        Ticket ticket = getTicketEntity(ticketId);

        if (principal.role() == UserRole.ADMIN) {
            applyAdminStatusTransition(ticket, request.status());
        } else if (principal.role() == UserRole.TECHNICIAN) {
            if (ticket.getAssignedTechnician() == null
                    || !Objects.equals(ticket.getAssignedTechnician().getId(), principal.id())) {
                throw new ForbiddenException("TICKET_NOT_ASSIGNED", "Only the assigned technician can update this ticket");
            }
            applyTechnicianStatusTransition(ticket, request.status());
        } else {
            throw new ForbiddenException("ROLE_NOT_ALLOWED", "Only technicians or admins can update ticket status");
        }

        Ticket savedTicket = ticketRepository.save(ticket);
        notificationService.createWorkflowNotification(
                savedTicket.getReporter(),
                principal.id(),
                NotificationType.TICKET_STATUS_CHANGED,
                "ticket-status-" + savedTicket.getId() + "-" + savedTicket.getStatus(),
                "Ticket status updated",
                "Ticket " + savedTicket.getId() + " moved to " + savedTicket.getStatus() + ".",
                "/tickets/" + savedTicket.getId());
        return toResponse(savedTicket);
    }

    @Transactional
    public TicketResponse assignTicket(UUID ticketId, AssignTicketRequest request) {
        Ticket ticket = getTicketEntity(ticketId);
        if (ticket.getStatus() == TicketStatus.CLOSED || ticket.getStatus() == TicketStatus.REJECTED) {
            throw new BadRequestException("TICKET_NOT_ASSIGNABLE", "Closed or rejected tickets cannot be assigned");
        }

        User technician = userRepository.findById(request.technicianId())
                .orElseThrow(() -> new NotFoundException("TECHNICIAN_NOT_FOUND", "Technician not found"));

        if (technician.getRole() != UserRole.TECHNICIAN) {
            throw new BadRequestException("INVALID_TECHNICIAN_ROLE", "Only technician accounts can be assigned");
        }

        if (technician.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("TECHNICIAN_NOT_ACTIVE", "Only active technicians can be assigned");
        }

        ticket.setAssignedTechnician(technician);
        Ticket savedTicket = ticketRepository.save(ticket);
        notificationService.createWorkflowNotification(
                savedTicket.getAssignedTechnician(),
                null,
                NotificationType.TICKET_ASSIGNED,
                "ticket-assigned-" + savedTicket.getId() + "-" + savedTicket.getAssignedTechnician().getId(),
                "Ticket assigned",
                "You have been assigned ticket " + savedTicket.getId() + ".",
                "/tickets/" + savedTicket.getId());
        return toResponse(savedTicket);
    }

    @Transactional
    public TicketResponse updateResolution(UUID ticketId, UpdateResolutionRequest request) {
        Ticket ticket = getTicketEntity(ticketId);
        if (ticket.getStatus() == TicketStatus.REJECTED) {
            throw new BadRequestException("TICKET_REJECTED", "Rejected tickets cannot receive resolution notes");
        }
        ticket.setResolutionNotes(request.resolutionNotes());
        return toResponse(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketResponse rejectTicket(UUID ticketId, RejectTicketRequest request) {
        Ticket ticket = getTicketEntity(ticketId);
        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new BadRequestException("TICKET_NOT_REJECTABLE", "Only open tickets can be rejected");
        }
        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setRejectionReason(request.reason());
        ticket.setResolutionNotes(null);
        ticket.setResolvedAt(null);
        Ticket savedTicket = ticketRepository.save(ticket);
        notificationService.createWorkflowNotification(
                savedTicket.getReporter(),
                null,
                NotificationType.TICKET_STATUS_CHANGED,
                "ticket-status-" + savedTicket.getId() + "-" + savedTicket.getStatus(),
                "Ticket rejected",
                "Ticket " + savedTicket.getId() + " was rejected. Reason: " + savedTicket.getRejectionReason(),
                "/tickets/" + savedTicket.getId());
        return toResponse(savedTicket);
    }

    @Transactional
    public TicketCommentResponse updateComment(
            UUID commentId, UserPrincipal principal, UpdateTicketCommentRequest request) {
        TicketComment comment = ticketCommentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("COMMENT_NOT_FOUND", "Comment not found"));
        ensureTicketAccess(comment.getTicket(), principal);
        ensureCommentOwnership(comment, principal);
        comment.setContent(request.content());
        return toCommentResponse(ticketCommentRepository.save(comment), principal.id());
    }

    @Transactional
    public void deleteComment(UUID commentId, UserPrincipal principal) {
        TicketComment comment = ticketCommentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("COMMENT_NOT_FOUND", "Comment not found"));
        ensureTicketAccess(comment.getTicket(), principal);
        ensureCommentOwnership(comment, principal);
        ticketCommentRepository.delete(comment);
    }

    @Transactional
    public void deleteImage(UUID ticketId, UUID imageId) {
        TicketImage image = ticketImageRepository.findByIdAndTicketId(imageId, ticketId)
                .orElseThrow(() -> new NotFoundException("IMAGE_NOT_FOUND", "Ticket image not found"));
        ticketImageRepository.delete(image);
        fileStorageService.delete(image.getStoragePath());
    }

    private void applyTechnicianStatusTransition(Ticket ticket, TicketStatus nextStatus) {
        if (ticket.getStatus() == TicketStatus.OPEN && nextStatus == TicketStatus.IN_PROGRESS) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
            return;
        }

        if (ticket.getStatus() == TicketStatus.IN_PROGRESS && nextStatus == TicketStatus.RESOLVED) {
            ticket.setStatus(TicketStatus.RESOLVED);
            ticket.setResolvedAt(Instant.now());
            return;
        }

        throw new BadRequestException(
                "INVALID_TICKET_TRANSITION",
                "Technicians can only move tickets from OPEN to IN_PROGRESS or IN_PROGRESS to RESOLVED");
    }

    private void applyAdminStatusTransition(Ticket ticket, TicketStatus nextStatus) {
        if (ticket.getStatus() == TicketStatus.OPEN && nextStatus == TicketStatus.IN_PROGRESS) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
            return;
        }

        if (ticket.getStatus() == TicketStatus.IN_PROGRESS && nextStatus == TicketStatus.RESOLVED) {
            ticket.setStatus(TicketStatus.RESOLVED);
            ticket.setResolvedAt(Instant.now());
            return;
        }

        if (ticket.getStatus() == TicketStatus.RESOLVED && nextStatus == TicketStatus.CLOSED) {
            ticket.setStatus(TicketStatus.CLOSED);
            return;
        }

        throw new BadRequestException(
                "INVALID_TICKET_TRANSITION",
                "Tickets must follow the OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED workflow");
    }

    private void ensureCommentOwnership(TicketComment comment, UserPrincipal principal) {
        if (!Objects.equals(comment.getAuthor().getId(), principal.id())) {
            throw new ForbiddenException("COMMENT_FORBIDDEN", "Only the comment author can edit or delete this comment");
        }
    }

    private Ticket getAccessibleTicket(UUID ticketId, UserPrincipal principal) {
        Ticket ticket = getTicketEntity(ticketId);
        ensureTicketAccess(ticket, principal);
        return ticket;
    }

    private void ensureTicketAccess(Ticket ticket, UserPrincipal principal) {
        if (principal.role() == UserRole.ADMIN) {
            return;
        }

        if (principal.role() == UserRole.USER && Objects.equals(ticket.getReporter().getId(), principal.id())) {
            return;
        }

        if (principal.role() == UserRole.TECHNICIAN
                && ticket.getAssignedTechnician() != null
                && Objects.equals(ticket.getAssignedTechnician().getId(), principal.id())) {
            return;
        }

        throw new ForbiddenException("TICKET_FORBIDDEN", "You do not have access to this ticket");
    }

    private Ticket getTicketEntity(UUID ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("TICKET_NOT_FOUND", "Ticket not found"));
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));
    }

    private Resource getResource(UUID resourceId) {
        return resourceRepository.findById(resourceId)
                .orElseThrow(() -> new NotFoundException("RESOURCE_NOT_FOUND", "Resource not found"));
    }

    private List<MultipartFile> normalizeImages(List<MultipartFile> images) {
        if (images == null) {
            return List.of();
        }

        return images.stream().filter(file -> file != null && !file.isEmpty()).toList();
    }

    private void validateImages(List<MultipartFile> images) {
        if (images.size() > MAX_IMAGE_COUNT) {
            throw new BadRequestException("IMAGE_LIMIT_EXCEEDED", "A ticket can include up to 3 images");
        }

        for (MultipartFile image : images) {
            if (image.getContentType() == null || !image.getContentType().startsWith("image/")) {
                throw new BadRequestException("INVALID_IMAGE_TYPE", "Only image uploads are allowed");
            }
        }
    }

    private void storeTicketImages(Ticket ticket, List<MultipartFile> images) {
        List<String> storedPaths = new ArrayList<>();
        try {
            for (MultipartFile image : images) {
                StoredFileDescriptor descriptor = fileStorageService.storeTicketImage(ticket.getId().toString(), image);
                storedPaths.add(descriptor.storagePath());

                TicketImage ticketImage = new TicketImage();
                ticketImage.setTicket(ticket);
                ticketImage.setOriginalFileName(descriptor.originalFileName());
                ticketImage.setStoredFileName(descriptor.storedFileName());
                ticketImage.setStoragePath(descriptor.storagePath());
                ticketImage.setContentType(descriptor.contentType());
                ticketImage.setSizeBytes(descriptor.sizeBytes());
                ticketImageRepository.save(ticketImage);
            }
        } catch (RuntimeException exception) {
            storedPaths.forEach(fileStorageService::delete);
            throw exception;
        }
    }

    private TicketResponse toResponse(Ticket ticket) {
        long imageCount = ticketImageRepository.countByTicketId(ticket.getId());
        long commentCount = ticketCommentRepository.countByTicketId(ticket.getId());

        return new TicketResponse(
                ticket.getId(),
                ticket.getResource() == null ? null : ticket.getResource().getId(),
                ticket.getResource() == null ? null : ticket.getResource().getName(),
                ticket.getReporter().getId(),
                ticket.getReporter().getFullName(),
                ticket.getAssignedTechnician() == null ? null : ticket.getAssignedTechnician().getId(),
                ticket.getAssignedTechnician() == null ? null : ticket.getAssignedTechnician().getFullName(),
                ticket.getCategory(),
                ticket.getDescription(),
                ticket.getPriority(),
                ticket.getPreferredContact(),
                ticket.getStatus(),
                ticket.getResolutionNotes(),
                ticket.getRejectionReason(),
                imageCount,
                commentCount,
                ticket.getResolvedAt(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt());
    }

    private TicketImageResponse toImageResponse(TicketImage image) {
        return new TicketImageResponse(
                image.getId(),
                image.getOriginalFileName(),
                image.getContentType(),
                image.getSizeBytes(),
                "/api/tickets/images/" + image.getId() + "/content",
                image.getCreatedAt());
    }

    private TicketCommentResponse toCommentResponse(TicketComment comment, UUID currentUserId) {
        return new TicketCommentResponse(
                comment.getId(),
                comment.getTicket().getId(),
                comment.getAuthor().getId(),
                comment.getAuthor().getFullName(),
                comment.getAuthor().getRole(),
                comment.getContent(),
                Objects.equals(comment.getAuthor().getId(), currentUserId),
                comment.getCreatedAt(),
                comment.getUpdatedAt());
    }
}

