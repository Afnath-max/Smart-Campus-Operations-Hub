package com.smartcampus.operationshub.dto.stats;

import com.smartcampus.operationshub.domain.ResourceType;
import java.util.UUID;

public record TopResourceStatResponse(
        UUID resourceId,
        String resourceName,
        ResourceType resourceType,
        String location,
        long totalRequests,
        long approvedBookings,
        long pendingRequests,
        long projectedAttendees) {
}

