package com.smartcampus.operationshub.service;

import com.smartcampus.operationshub.domain.AccountStatus;
import com.smartcampus.operationshub.domain.Booking;
import com.smartcampus.operationshub.domain.BookingStatus;
import com.smartcampus.operationshub.domain.Resource;
import com.smartcampus.operationshub.domain.ResourceStatus;
import com.smartcampus.operationshub.domain.Ticket;
import com.smartcampus.operationshub.domain.TicketCategory;
import com.smartcampus.operationshub.domain.TicketPriority;
import com.smartcampus.operationshub.domain.TicketStatus;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import com.smartcampus.operationshub.dto.stats.BookingStatsResponse;
import com.smartcampus.operationshub.dto.stats.MetricPointResponse;
import com.smartcampus.operationshub.dto.stats.OverviewStatsResponse;
import com.smartcampus.operationshub.dto.stats.SlaPriorityResponse;
import com.smartcampus.operationshub.dto.stats.SlaStatsResponse;
import com.smartcampus.operationshub.dto.stats.TicketStatsResponse;
import com.smartcampus.operationshub.dto.stats.TopResourceStatResponse;
import com.smartcampus.operationshub.repository.BookingRepository;
import com.smartcampus.operationshub.repository.ResourceRepository;
import com.smartcampus.operationshub.repository.TicketRepository;
import com.smartcampus.operationshub.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private static final ZoneId ZONE_ID = ZoneId.systemDefault();
    private static final DateTimeFormatter DAY_LABEL_FORMATTER = DateTimeFormatter.ofPattern("MMM d");

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public AnalyticsService(
            ResourceRepository resourceRepository,
            BookingRepository bookingRepository,
            TicketRepository ticketRepository,
            UserRepository userRepository) {
        this.resourceRepository = resourceRepository;
        this.bookingRepository = bookingRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    public OverviewStatsResponse getOverview() {
        List<Resource> resources = resourceRepository.findAll();
        List<Booking> bookings = bookingRepository.findAll();
        List<Ticket> tickets = ticketRepository.findAll();
        List<User> users = userRepository.findAll();

        long totalResources = resources.size();
        long activeResources = resources.stream().filter(resource -> resource.getStatus() == ResourceStatus.ACTIVE).count();
        long totalUsers = users.size();
        long activeTechnicians = users.stream()
                .filter(user -> user.getRole() == UserRole.TECHNICIAN && user.getAccountStatus() == AccountStatus.ACTIVE)
                .count();

        return new OverviewStatsResponse(
                totalResources,
                activeResources,
                totalResources - activeResources,
                totalUsers,
                activeTechnicians,
                countBookings(bookings, BookingStatus.PENDING),
                countBookings(bookings, BookingStatus.APPROVED),
                tickets.stream().filter(this::isActiveTicket).count(),
                calculateAverageResolutionHours(tickets));
    }

    public BookingStatsResponse getBookingStats() {
        List<Booking> bookings = bookingRepository.findAll();
        Map<BookingStatus, Long> statusCounts = Arrays.stream(BookingStatus.values())
                .collect(Collectors.toMap(status -> status, status -> countBookings(bookings, status), (left, right) -> left, () -> new EnumMap<>(BookingStatus.class)));

        return new BookingStatsResponse(
                bookings.size(),
                statusCounts.getOrDefault(BookingStatus.PENDING, 0L),
                statusCounts.getOrDefault(BookingStatus.APPROVED, 0L),
                statusCounts.getOrDefault(BookingStatus.REJECTED, 0L),
                statusCounts.getOrDefault(BookingStatus.CANCELLED, 0L),
                Arrays.stream(BookingStatus.values())
                        .map(status -> new MetricPointResponse(status.name(), statusCounts.getOrDefault(status, 0L)))
                        .toList(),
                buildRecentDailyVolume(bookings.stream()
                        .map(Booking::getCreatedAt)
                        .toList()));
    }

    public TicketStatsResponse getTicketStats() {
        List<Ticket> tickets = ticketRepository.findAll();

        return new TicketStatsResponse(
                tickets.size(),
                countTickets(tickets, TicketStatus.OPEN),
                countTickets(tickets, TicketStatus.IN_PROGRESS),
                countTickets(tickets, TicketStatus.RESOLVED),
                countTickets(tickets, TicketStatus.CLOSED),
                countTickets(tickets, TicketStatus.REJECTED),
                Arrays.stream(TicketStatus.values())
                        .map(status -> new MetricPointResponse(status.name(), countTickets(tickets, status)))
                        .toList(),
                Arrays.stream(TicketPriority.values())
                        .map(priority -> new MetricPointResponse(priority.name(), countTicketsByPriority(tickets, priority)))
                        .toList(),
                Arrays.stream(TicketCategory.values())
                        .map(category -> new MetricPointResponse(category.name(), countTicketsByCategory(tickets, category)))
                        .toList());
    }

    public List<TopResourceStatResponse> getTopResources() {
        Map<UUID, ResourceRollup> rollups = new java.util.HashMap<>();

        for (Booking booking : bookingRepository.findAll()) {
            Resource resource = booking.getResource();
            ResourceRollup rollup = rollups.computeIfAbsent(resource.getId(), ignored -> new ResourceRollup(resource));
            rollup.totalRequests += 1;
            rollup.projectedAttendees += booking.getExpectedAttendees();
            if (booking.getStatus() == BookingStatus.APPROVED) {
                rollup.approvedBookings += 1;
            }
            if (booking.getStatus() == BookingStatus.PENDING) {
                rollup.pendingRequests += 1;
            }
        }

        return rollups.values().stream()
                .sorted(Comparator.comparingLong(ResourceRollup::score).reversed()
                        .thenComparing(rollup -> rollup.resource.getName(), String.CASE_INSENSITIVE_ORDER))
                .limit(5)
                .map(rollup -> new TopResourceStatResponse(
                        rollup.resource.getId(),
                        rollup.resource.getName(),
                        rollup.resource.getType(),
                        rollup.resource.getLocation(),
                        rollup.totalRequests,
                        rollup.approvedBookings,
                        rollup.pendingRequests,
                        rollup.projectedAttendees))
                .toList();
    }

    public SlaStatsResponse getSlaStats() {
        List<Ticket> tickets = ticketRepository.findAll();
        List<Ticket> resolvedTickets = tickets.stream()
                .filter(ticket -> ticket.getResolvedAt() != null)
                .toList();
        List<Ticket> activeTickets = tickets.stream().filter(this::isActiveTicket).toList();

        long resolvedWithinTarget = resolvedTickets.stream()
                .filter(ticket -> isWithinResolutionTarget(ticket, ticket.getResolvedAt()))
                .count();
        long resolvedBreached = resolvedTickets.size() - resolvedWithinTarget;
        long activeWithinTarget = activeTickets.stream().filter(this::isActiveWithinTarget).count();
        long activeAtRisk = activeTickets.stream().filter(this::isActiveAtRisk).count();
        long activeBreached = activeTickets.stream().filter(this::isActiveBreached).count();

        List<SlaPriorityResponse> priorityBreakdown = Arrays.stream(TicketPriority.values())
                .map(priority -> buildPrioritySla(priority, tickets))
                .toList();

        return new SlaStatsResponse(
                calculateAverageResolutionHours(tickets),
                resolvedWithinTarget,
                resolvedBreached,
                activeWithinTarget,
                activeAtRisk,
                activeBreached,
                priorityBreakdown);
    }

    private List<MetricPointResponse> buildRecentDailyVolume(List<Instant> createdAtMoments) {
        Map<LocalDate, Long> countsByDay = createdAtMoments.stream()
                .collect(Collectors.groupingBy(
                        instant -> instant.atZone(ZONE_ID).toLocalDate(),
                        Collectors.counting()));

        List<MetricPointResponse> points = new ArrayList<>();
        LocalDate today = LocalDate.now(ZONE_ID);

        for (int offset = 6; offset >= 0; offset -= 1) {
            LocalDate day = today.minusDays(offset);
            points.add(new MetricPointResponse(
                    DAY_LABEL_FORMATTER.format(day),
                    countsByDay.getOrDefault(day, 0L)));
        }

        return points;
    }

    private long countBookings(List<Booking> bookings, BookingStatus status) {
        return bookings.stream().filter(booking -> booking.getStatus() == status).count();
    }

    private long countTickets(List<Ticket> tickets, TicketStatus status) {
        return tickets.stream().filter(ticket -> ticket.getStatus() == status).count();
    }

    private long countTicketsByPriority(List<Ticket> tickets, TicketPriority priority) {
        return tickets.stream().filter(ticket -> ticket.getPriority() == priority).count();
    }

    private long countTicketsByCategory(List<Ticket> tickets, TicketCategory category) {
        return tickets.stream().filter(ticket -> ticket.getCategory() == category).count();
    }

    private double calculateAverageResolutionHours(List<Ticket> tickets) {
        List<Double> durations = tickets.stream()
                .filter(ticket -> ticket.getResolvedAt() != null)
                .map(ticket -> Duration.between(ticket.getCreatedAt(), ticket.getResolvedAt()).toMinutes() / 60.0)
                .toList();

        if (durations.isEmpty()) {
            return 0.0;
        }

        double average = durations.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        return round(average);
    }

    private boolean isWithinResolutionTarget(Ticket ticket, Instant end) {
        return Duration.between(ticket.getCreatedAt(), end).compareTo(targetFor(ticket.getPriority())) <= 0;
    }

    private boolean isActiveTicket(Ticket ticket) {
        return ticket.getStatus() == TicketStatus.OPEN || ticket.getStatus() == TicketStatus.IN_PROGRESS;
    }

    private boolean isActiveWithinTarget(Ticket ticket) {
        if (!isActiveTicket(ticket)) {
            return false;
        }
        Duration age = Duration.between(ticket.getCreatedAt(), Instant.now());
        return age.compareTo(thresholdForAtRisk(ticket.getPriority())) < 0;
    }

    private boolean isActiveAtRisk(Ticket ticket) {
        if (!isActiveTicket(ticket)) {
            return false;
        }
        Duration age = Duration.between(ticket.getCreatedAt(), Instant.now());
        return age.compareTo(thresholdForAtRisk(ticket.getPriority())) >= 0
                && age.compareTo(targetFor(ticket.getPriority())) <= 0;
    }

    private boolean isActiveBreached(Ticket ticket) {
        return isActiveTicket(ticket)
                && Duration.between(ticket.getCreatedAt(), Instant.now()).compareTo(targetFor(ticket.getPriority())) > 0;
    }

    private SlaPriorityResponse buildPrioritySla(TicketPriority priority, List<Ticket> tickets) {
        List<Ticket> matchingTickets = tickets.stream().filter(ticket -> ticket.getPriority() == priority).toList();
        List<Ticket> resolved = matchingTickets.stream().filter(ticket -> ticket.getResolvedAt() != null).toList();
        long withinTarget = resolved.stream().filter(ticket -> isWithinResolutionTarget(ticket, ticket.getResolvedAt())).count();
        long breached = matchingTickets.stream().filter(this::isActiveBreached).count();
        long atRisk = matchingTickets.stream().filter(this::isActiveAtRisk).count();

        double averageResolutionHours = resolved.isEmpty()
                ? 0.0
                : round(resolved.stream()
                        .mapToDouble(ticket -> Duration.between(ticket.getCreatedAt(), ticket.getResolvedAt()).toMinutes() / 60.0)
                        .average()
                        .orElse(0.0));

        return new SlaPriorityResponse(
                priority.name(),
                targetFor(priority).toHours(),
                withinTarget,
                atRisk,
                breached,
                averageResolutionHours);
    }

    private Duration targetFor(TicketPriority priority) {
        return switch (priority) {
            case HIGH -> Duration.ofHours(8);
            case MEDIUM -> Duration.ofHours(24);
            case LOW -> Duration.ofHours(72);
        };
    }

    private Duration thresholdForAtRisk(TicketPriority priority) {
        return Duration.ofMinutes((long) (targetFor(priority).toMinutes() * 0.7));
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    private static final class ResourceRollup {
        private final Resource resource;
        private long totalRequests;
        private long approvedBookings;
        private long pendingRequests;
        private long projectedAttendees;

        private ResourceRollup(Resource resource) {
            this.resource = resource;
        }

        private long score() {
            return (approvedBookings * 10) + totalRequests;
        }
    }
}
