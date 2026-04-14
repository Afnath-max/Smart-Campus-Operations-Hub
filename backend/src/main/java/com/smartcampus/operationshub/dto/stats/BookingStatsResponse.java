package com.smartcampus.operationshub.dto.stats;

import java.util.List;

public record BookingStatsResponse(
        long totalBookings,
        long pendingBookings,
        long approvedBookings,
        long rejectedBookings,
        long cancelledBookings,
        List<MetricPointResponse> statusBreakdown,
        List<MetricPointResponse> dailyVolume) {
}
