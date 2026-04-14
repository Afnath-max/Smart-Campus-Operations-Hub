package com.smartcampus.operationshub.repository;

import com.smartcampus.operationshub.domain.Ticket;
import com.smartcampus.operationshub.domain.TicketStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TicketRepository extends JpaRepository<Ticket, UUID>, JpaSpecificationExecutor<Ticket> {

    List<Ticket> findAllByReporterIdOrderByCreatedAtDesc(UUID reporterId);

    List<Ticket> findAllByAssignedTechnicianIdOrderByCreatedAtDesc(UUID technicianId);

    List<Ticket> findAllByAssignedTechnicianIdAndStatusOrderByCreatedAtDesc(UUID technicianId, TicketStatus status);

    Optional<Ticket> findByIdAndReporterId(UUID id, UUID reporterId);
}
