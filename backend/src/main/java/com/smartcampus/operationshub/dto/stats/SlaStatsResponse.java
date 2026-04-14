package com.smartcampus.operationshub.dto.stats;

import java.util.List;

public record SlaStatsResponse(
        double averageResolutionHours,
        long resolvedWithinTarget,
        long resolvedBreached,
        long activeWithinTarget,
        long activeAtRisk,
        long activeBreached,
        List<SlaPriorityResponse> priorityBreakdown) {
}
