package com.project.namaste_health_system.controller;

import com.project.namaste_health_system.dto.PrescriptionRequest;
import com.project.namaste_health_system.entity.Prescription;
import com.project.namaste_health_system.service.PrescriptionService;
import com.project.namaste_health_system.utility.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final JwtUtil jwtUtil;

    public PrescriptionController(PrescriptionService prescriptionService, JwtUtil jwtUtil) {
        this.prescriptionService = prescriptionService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    public ResponseEntity<?> createPrescription(@Valid @RequestBody PrescriptionRequest request,
                                                HttpServletRequest httpRequest) {
        try {
            Long doctorId = extractUserId(httpRequest);
            Prescription prescription = prescriptionService.createPrescription(doctorId, request);
            return ResponseEntity.ok(prescription);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Prescription>> getAllPrescriptions() {
        return ResponseEntity.ok(prescriptionService.getAllPrescriptions());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Prescription>> getPendingPrescriptions() {
        return ResponseEntity.ok(prescriptionService.getPendingPrescriptions());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Prescription>> getPrescriptionsForPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsForPatient(patientId));
    }

    @GetMapping("/diagnosis/{diagnosisId}")
    public ResponseEntity<List<Prescription>> getPrescriptionsForDiagnosis(@PathVariable Long diagnosisId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsForDiagnosis(diagnosisId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Prescription>> getMyPrescriptions(HttpServletRequest httpRequest) {
        Long patientId = extractUserId(httpRequest);
        return ResponseEntity.ok(prescriptionService.getPrescriptionsForPatient(patientId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPrescriptionById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(prescriptionService.getPrescriptionById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
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
