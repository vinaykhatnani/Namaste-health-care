package com.project.namaste_health_system.controller;

import com.project.namaste_health_system.dto.DiagnosisRequest;
import com.project.namaste_health_system.entity.Diagnosis;
import com.project.namaste_health_system.service.DiagnosisService;
import com.project.namaste_health_system.utility.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diagnoses")
public class DiagnosisController {

    private final DiagnosisService diagnosisService;
    private final JwtUtil jwtUtil;

    public DiagnosisController(DiagnosisService diagnosisService, JwtUtil jwtUtil) {
        this.diagnosisService = diagnosisService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    public ResponseEntity<?> createDiagnosis(@Valid @RequestBody DiagnosisRequest request,
                                             HttpServletRequest httpRequest) {
        try {
            Long doctorId = extractUserId(httpRequest);
            Diagnosis diagnosis = diagnosisService.createDiagnosis(doctorId, request);
            return ResponseEntity.ok(diagnosis);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Diagnosis>> getDiagnosesForPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(diagnosisService.getDiagnosesForPatient(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Diagnosis>> getDiagnosesForDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(diagnosisService.getDiagnosesForDoctor(doctorId));
    }

    @GetMapping("/my/diagnoses")
    public ResponseEntity<List<Diagnosis>> getMyDiagnoses(HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(diagnosisService.getDiagnosesForPatient(userId));
    }

    @GetMapping("/my/doctor-diagnoses")
    public ResponseEntity<List<Diagnosis>> getMyDoctorDiagnoses(HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(diagnosisService.getDiagnosesForDoctor(userId));
    }

    @GetMapping
    public ResponseEntity<List<Diagnosis>> getAllDiagnoses() {
        return ResponseEntity.ok(diagnosisService.getAllDiagnoses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDiagnosisById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(diagnosisService.getDiagnosisById(id));
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
