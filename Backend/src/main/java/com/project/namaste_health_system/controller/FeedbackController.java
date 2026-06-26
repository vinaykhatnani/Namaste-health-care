package com.project.namaste_health_system.controller;

import com.project.namaste_health_system.dto.FeedbackRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "*")
public class FeedbackController {

    private final RestTemplate restTemplate;

    @Value("${ml.api.url:http://127.0.0.1:8000}")
    private String mlApiUrl;

    public FeedbackController(org.springframework.boot.web.client.RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder.build();
    }

    @PostMapping
    public ResponseEntity<?> submitFeedback(@RequestBody FeedbackRequest feedbackRequest) {
        // Map Spring Boot DTO to FastAPI expected format
        Map<String, Object> fastApiPayload = new HashMap<>();
        fastApiPayload.put("symptoms", feedbackRequest.getSymptoms());
        fastApiPayload.put("correct_icd_code", feedbackRequest.getCorrectIcdCode());
        fastApiPayload.put("correct_disease", feedbackRequest.getCorrectDisease());
        if (feedbackRequest.getDoctorId() != null) {
            fastApiPayload.put("doctor_id", feedbackRequest.getDoctorId());
        }

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    mlApiUrl + "/feedback",
                    fastApiPayload,
                    String.class
            );
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to submit feedback to ML service: " + e.getMessage());
        }
    }

    @GetMapping("/metrics")
    public ResponseEntity<?> getMetrics() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(mlApiUrl + "/metrics", Map.class);
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("accuracy", 0.0, "total_entries", 0, "error", e.getMessage()));
        }
    }
}
