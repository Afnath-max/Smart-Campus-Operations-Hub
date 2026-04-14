package com.smartcampus.operationshub.features.tickets.repository;

import com.smartcampus.operationshub.domain.TicketImage;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketImageRepository extends JpaRepository<TicketImage, UUID> {

    List<TicketImage> findAllByTicketIdOrderByCreatedAtAsc(UUID ticketId);

    long countByTicketId(UUID ticketId);

    Optional<TicketImage> findByIdAndTicketId(UUID id, UUID ticketId);
}

