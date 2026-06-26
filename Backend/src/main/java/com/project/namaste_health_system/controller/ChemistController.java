package com.project.namaste_health_system.controller;

import com.project.namaste_health_system.entity.ChemistProfile;
import com.project.namaste_health_system.entity.MedicineRequest;
import com.project.namaste_health_system.entity.DispenseIssue;
import com.project.namaste_health_system.service.ChemistService;
import com.project.namaste_health_system.utility.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chemist")
public class ChemistController {

    private final ChemistService chemistService;
    private final JwtUtil jwtUtil;

    public ChemistController(ChemistService chemistService, JwtUtil jwtUtil) {
        this.chemistService = chemistService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/profile")
    public ResponseEntity<?> saveProfile(@RequestBody ChemistProfile profile, HttpServletRequest request) {
        try {
            Long chemistId = extractUserId(request);
            ChemistProfile saved = chemistService.saveProfile(chemistId, profile);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        try {
            Long chemistId = extractUserId(request);
            return chemistService.getProfile(chemistId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/request-medicine-change")
    public ResponseEntity<?> requestMedicineChange(@RequestBody MedicineRequest medRequest, HttpServletRequest request) {
        try {
            Long chemistId = extractUserId(request);
            MedicineRequest saved = chemistService.requestMedicineChange(chemistId, medRequest);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getRequests(HttpServletRequest request) {
        try {
            Long chemistId = extractUserId(request);
            return ResponseEntity.ok(chemistService.getRequestsForChemist(chemistId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/report-issue")
    public ResponseEntity<?> reportIssue(@RequestBody DispenseIssue issue, HttpServletRequest request) {
        try {
            Long chemistId = extractUserId(request);
            DispenseIssue saved = chemistService.reportIssue(chemistId, issue);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Long extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(authHeader.substring(7));
        }
        throw new RuntimeException("Authorization header missing");
    }
}
