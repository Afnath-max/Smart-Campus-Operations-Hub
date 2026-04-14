package com.smartcampus.operationshub.dto.stats;

public record OverviewStatsResponse(
        long totalResources,
        long activeResources,
        long outOfServiceResources,
        long totalUsers,
        long activeTechnicians,
        long pendingBookings,
        long approvedBookings,
        long openTickets,
        double averageResolutionHours) {
}

