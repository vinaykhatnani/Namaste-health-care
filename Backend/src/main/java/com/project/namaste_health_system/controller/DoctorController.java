package com.project.namaste_health_system.controller;

import com.project.namaste_health_system.entity.DoctorProfile;
import com.project.namaste_health_system.entity.MedicineRequest;
import com.project.namaste_health_system.service.ChemistService;
import com.project.namaste_health_system.service.DoctorService;
import com.project.namaste_health_system.utility.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/doctor")
public class DoctorController {

    private final DoctorService doctorService;
    private final ChemistService chemistService;
    private final JwtUtil jwtUtil;

    public DoctorController(DoctorService doctorService, ChemistService chemistService, JwtUtil jwtUtil) {
        this.doctorService = doctorService;
        this.chemistService = chemistService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getRequests(HttpServletRequest request) {
        try {
            Long doctorId = extractUserId(request);
            return ResponseEntity.ok(chemistService.getRequestsForDoctor(doctorId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/respond")
    public ResponseEntity<?> respondToRequest(@RequestBody Map<String, Object> body) {
        try {
            Long requestId = ((Number) body.get("requestId")).longValue();
            String statusStr = (String) body.get("status");
            MedicineRequest.RequestStatus status = MedicineRequest.RequestStatus.valueOf(statusStr.toUpperCase());
            MedicineRequest saved = chemistService.respondToRequest(requestId, status);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/profile")
    public ResponseEntity<?> saveProfile(@RequestBody DoctorProfile profile, HttpServletRequest request) {
        try {
            Long doctorId = extractUserId(request);
            DoctorProfile saved = doctorService.saveProfile(doctorId, profile);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        try {
            Long doctorId = extractUserId(request);
            return doctorService.getProfile(doctorId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(HttpServletRequest request) {
        try {
            Long doctorId = extractUserId(request);
            Map<String, Object> data = doctorService.getDoctorDashboard(doctorId);
            return ResponseEntity.ok(data);
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
