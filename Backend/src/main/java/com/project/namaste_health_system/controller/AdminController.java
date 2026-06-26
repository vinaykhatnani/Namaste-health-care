package com.project.namaste_health_system.controller;

import com.project.namaste_health_system.entity.DispenseIssue;
import com.project.namaste_health_system.service.ChemistService;
import com.project.namaste_health_system.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ChemistService chemistService;
    private final AnalyticsService analyticsService;

    public AdminController(ChemistService chemistService, AnalyticsService analyticsService) {
        this.chemistService = chemistService;
        this.analyticsService = analyticsService;
    }

    @GetMapping("/issues")
    public ResponseEntity<List<DispenseIssue>> getIssues() {
        return ResponseEntity.ok(chemistService.getAllIssues());
    }

    @PostMapping("/resolve")
    public ResponseEntity<?> resolveIssue(@RequestBody Map<String, Object> body) {
        try {
            Long issueId = ((Number) body.get("issueId")).longValue();
            String statusStr = (String) body.get("status");
            DispenseIssue.IssueStatus status = DispenseIssue.IssueStatus.valueOf(statusStr.toUpperCase());
            DispenseIssue resolved = chemistService.resolveIssue(issueId, status);
            return ResponseEntity.ok(resolved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/disease-analytics")
    public ResponseEntity<List<Map<String, Object>>> getDiseaseAnalytics() {
        return ResponseEntity.ok(analyticsService.getDiseaseAnalytics());
    }
}
