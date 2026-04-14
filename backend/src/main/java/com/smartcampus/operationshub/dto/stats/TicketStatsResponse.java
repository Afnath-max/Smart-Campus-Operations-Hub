package com.smartcampus.operationshub.dto.stats;

import java.util.List;

public record TicketStatsResponse(
        long totalTickets,
        long openTickets,
        long inProgressTickets,
        long resolvedTickets,
        long closedTickets,
        long rejectedTickets,
        List<MetricPointResponse> statusBreakdown,
        List<MetricPointResponse> priorityBreakdown,
        List<MetricPointResponse> categoryBreakdown) {
}

