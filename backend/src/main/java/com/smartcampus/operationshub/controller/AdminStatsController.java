package com.smartcampus.operationshub.controller;

import com.smartcampus.operationshub.dto.stats.BookingStatsResponse;
import com.smartcampus.operationshub.dto.stats.OverviewStatsResponse;
import com.smartcampus.operationshub.dto.stats.SlaStatsResponse;
import com.smartcampus.operationshub.dto.stats.TicketStatsResponse;
import com.smartcampus.operationshub.dto.stats.TopResourceStatResponse;
import com.smartcampus.operationshub.service.AnalyticsService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/stats")
public class AdminStatsController {

    private final AnalyticsService analyticsService;

    public AdminStatsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    public ResponseEntity<OverviewStatsResponse> getOverview() {
        return ResponseEntity.ok(analyticsService.getOverview());
    }

    @GetMapping("/bookings")
    public ResponseEntity<BookingStatsResponse> getBookingStats() {
        return ResponseEntity.ok(analyticsService.getBookingStats());
    }

    @GetMapping("/tickets")
    public ResponseEntity<TicketStatsResponse> getTicketStats() {
        return ResponseEntity.ok(analyticsService.getTicketStats());
    }

    @GetMapping("/resources/top")
    public ResponseEntity<List<TopResourceStatResponse>> getTopResources() {
        return ResponseEntity.ok(analyticsService.getTopResources());
    }

    @GetMapping("/sla")
    public ResponseEntity<SlaStatsResponse> getSlaStats() {
        return ResponseEntity.ok(analyticsService.getSlaStats());
    }
}

