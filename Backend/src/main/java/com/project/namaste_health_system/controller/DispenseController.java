package com.project.namaste_health_system.controller;

import com.project.namaste_health_system.entity.Dispense;
import com.project.namaste_health_system.service.DispenseService;
import com.project.namaste_health_system.utility.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dispenses")
public class DispenseController {

    private final DispenseService dispenseService;
    private final JwtUtil jwtUtil;

    public DispenseController(DispenseService dispenseService, JwtUtil jwtUtil) {
        this.dispenseService = dispenseService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/prescriptions/{prescriptionId}/dispense")
    public ResponseEntity<?> dispensePrescription(@PathVariable Long prescriptionId,
                                                  @RequestBody(required = false) Map<String, String> body,
                                                  HttpServletRequest httpRequest) {
        try {
            Long chemistId = extractUserId(httpRequest);
            String notes = body != null ? body.get("notes") : null;
            Dispense dispense = dispenseService.dispensePrescription(prescriptionId, chemistId, notes);
            return ResponseEntity.ok(dispense);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<Dispense>> getMyDispenses(HttpServletRequest httpRequest) {
        Long chemistId = extractUserId(httpRequest);
        return ResponseEntity.ok(dispenseService.getDispensesByChemist(chemistId));
    }

    @GetMapping("/prescriptions/{prescriptionId}/status")
    public ResponseEntity<Map<String, Boolean>> checkDispensed(@PathVariable Long prescriptionId) {
        boolean dispensed = dispenseService.isDispensed(prescriptionId);
        return ResponseEntity.ok(Map.of("dispensed", dispensed));
    }

    private Long extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(authHeader.substring(7));
        }
        throw new RuntimeException("Authorization header missing");
    }
}
