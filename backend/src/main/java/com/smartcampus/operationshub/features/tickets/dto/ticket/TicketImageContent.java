package com.smartcampus.operationshub.dto.ticket;

import org.springframework.core.io.Resource;

public record TicketImageContent(Resource resource, String contentType, String fileName) {
}
