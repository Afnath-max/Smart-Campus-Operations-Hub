package com.smartcampus.operationshub.dto.stats;

public record SlaPriorityResponse(
        String priority,
        long targetHours,
        long withinTarget,
        long atRisk,
        long breached,
        double averageResolutionHours) {
}

