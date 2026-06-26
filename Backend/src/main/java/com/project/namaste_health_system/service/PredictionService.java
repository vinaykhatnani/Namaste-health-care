package com.project.namaste_health_system.service;

import com.project.namaste_health_system.dto.MLPredictionItem;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import io.github.resilience4j.retry.annotation.Retry;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * PredictionService — Clean Architecture Phase
 * ============================
 * Calls the FastAPI ML service (/predict) and parses the full top-3 predictions list.
 * Each prediction has a REAL probability/confidence (0.0–1.0, unique per disease).
 * No static values. No hardcoding.
 */
@Service
public class PredictionService {

    private static final Logger logger = LoggerFactory.getLogger(PredictionService.class);

    @Value("${ml.api.url}")
    private String mlApiUrl;

    @Value("${ml.api.key:secure-key-123}")
    private String mlApiKey;

    private final RestTemplate restTemplate;

    public PredictionService(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(3))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
    }

    /**
     * Phase 3: Returns the TOP prediction (primary) for use in saving to DB.
     * Also internally logs the full top-3 list for audit/traceability.
     */
    public MLPrediction predict(String symptoms, String diseaseName, String language) {
        MLResponse mlResponse = predictAll(symptoms, diseaseName, language, null, null);
        List<MLPredictionItem> allPredictions = mlResponse.getPredictions();

        if (!allPredictions.isEmpty()) {
            // ✅ PHASE 3: Log ALL top predictions (not just the first one)
            logger.info("═══════════════════════════════════════════");
            logger.info("  TOP ML PREDICTIONS (Phase 3)");
            logger.info("═══════════════════════════════════════════");
            for (int i = 0; i < allPredictions.size(); i++) {
                MLPredictionItem item = allPredictions.get(i);
                logger.info("  #{} Disease: {} | ICD: {} | Confidence: {}",
                        (i + 1), item.getDisease(), item.getIcdCode(),
                        String.format("%.4f", item.getConfidence()));
            }
            logger.info("═══════════════════════════════════════════");

            // Return top prediction wrapped in MLPrediction for backward compatibility
            MLPredictionItem top = allPredictions.get(0);
            MLPrediction prediction = new MLPrediction();
            prediction.setDisease(top.getDisease());
            prediction.setIcdCode(top.getIcdCode());
            prediction.setConfidence(top.getConfidence());
            prediction.setNamasteCode(top.getNamasteCode());
            prediction.setNamasteTerm(top.getNamasteTerm());
            prediction.setEnglishDisease(top.getEnglishDisease());
            return prediction;
        }

        // Fallback when ML service is unavailable
        logger.warn("Using fallback prediction — ML service unavailable or returned empty results");
        MLPrediction fallback = new MLPrediction();
        fallback.setDisease("Unknown (ML service unavailable)");
        fallback.setIcdCode("N/A");
        fallback.setConfidence(0.0);
        fallback.setNamasteCode("N/A");
        fallback.setNamasteTerm("N/A");
        fallback.setEnglishDisease("Unknown (ML service unavailable)");
        return fallback;
    }

    /**
     * Phase 3: New method — returns FULL top-3 ML predictions with real dynamic confidence scores.
     * Used by DiagnosisService to attach all predictions to the response.
     */
    @org.springframework.cache.annotation.Cacheable(value = "predictions", key = "#symptoms + '-' + #diseaseName")
    @io.github.resilience4j.ratelimiter.annotation.RateLimiter(name = "mlApi")
    @Retry(name = "mlApi", fallbackMethod = "fallbackPredictAll")
    public MLResponse predictAll(String symptoms, String diseaseName, String language, String severity, String duration) {
        long startTime = System.currentTimeMillis();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-API-KEY", mlApiKey);

            Map<String, String> body = new HashMap<>();
            body.put("symptoms", symptoms);
            if (diseaseName != null) {
                body.put("disease_name", diseaseName);
            }
            if (language != null) {
                body.put("language", language);
            }
            if (severity != null) {
                body.put("severity", severity);
            }
            if (duration != null) {
                body.put("duration", duration);
            }

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

            logger.info("Calling ML API: {} | symptoms length={}", mlApiUrl + "/predict", symptoms.length());

            ResponseEntity<Map> response = restTemplate.exchange(
                    mlApiUrl + "/predict",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> data = response.getBody();

                // Phase 3: Parse the full "predictions" array (not just predictions[0])
                List<Map<String, Object>> rawPredictions = (List<Map<String, Object>>) data.get("predictions");

                if (rawPredictions != null && !rawPredictions.isEmpty()) {
                    List<MLPredictionItem> items = new ArrayList<>();
                    for (Map<String, Object> pred : rawPredictions) {
                        MLPredictionItem item = new MLPredictionItem();
                        item.setDisease((String) pred.get("disease"));
                        item.setIcdCode((String) pred.get("icd_code"));
                        item.setNamasteCode((String) pred.get("namaste_code"));
                        item.setNamasteTerm((String) pred.get("namaste_term"));
                        item.setEnglishDisease((String) pred.get("english_disease"));
                        
                        Object conf = pred.get("confidence");
                        item.setConfidence(conf instanceof Number ? ((Number) conf).doubleValue() : 0.0);
                        
                        Boolean isRelative = (Boolean) pred.get("isRelative");
                        item.setRelative(isRelative != null ? isRelative : false);
                        
                        List<String> matchedSymptoms = (List<String>) pred.get("matchedSymptoms");
                        item.setMatchedSymptoms(matchedSymptoms != null ? matchedSymptoms : new ArrayList<>());

                        item.setConfidenceLabel((String) pred.get("confidenceLabel"));
                        item.setRiskLevel((String) pred.get("riskLevel"));
                        item.setClinicalNote((String) pred.get("clinicalNote"));
                        item.setExplanation((Map<String, String>) pred.get("explanation"));
                        item.setCodeExplanation((Map<String, String>) pred.get("codeExplanation"));
                        item.setErtcInsights((Map<String, Object>) pred.get("ertcInsights"));
                        item.setInsuranceInsights((Map<String, Object>) pred.get("insuranceInsights"));
                        
                        Map<String, Double> breakdown = new HashMap<>();
                        Map<String, Object> rawBreakdown = (Map<String, Object>) pred.get("confidenceBreakdown");
                        if (rawBreakdown != null) {
                            rawBreakdown.forEach((k, v) -> breakdown.put(k, v instanceof Number ? ((Number) v).doubleValue() : 0.0));
                        }
                        item.setConfidenceBreakdown(breakdown);
                        
                        items.add(item);
                    }
                    MLResponse mlResponse = new MLResponse();
                    mlResponse.setTraceId((String) data.get("traceId"));
                    mlResponse.setModelVersion((String) data.get("modelVersion"));
                    mlResponse.setPredictions(items);
                    
                    Object latency = data.get("latencyMs");
                    if (latency instanceof Number) {
                        mlResponse.setLatencyMs(((Number) latency).intValue());
                    }
                    
                    long totalTime = System.currentTimeMillis() - startTime;
                    logger.info("ML API Success | Latency: {}ms", totalTime);
                    
                    return mlResponse;
                }
            }

        } catch (HttpClientErrorException.TooManyRequests e) {
            logger.warn("ML API Rate Limited (429)");
            return createErrorResponse("Too many requests. Please wait.", "RATE_LIMIT", "Too many requests to AI service.");
        } catch (Exception e) {
            logger.error("ML API call failed: {}", e.getMessage());
            throw e; // Rethrow to trigger @Retry
        }

        return createErrorResponse("ML service unavailable", "UNKNOWN", "AI service temporarily unavailable");
    }

    public MLResponse fallbackPredictAll(String symptoms, String diseaseName, String language, String severity, String duration, Exception e) {
        logger.error("All ML API retries exhausted. Fallback triggered: {}", e.getMessage());
        return createErrorResponse("ML service unavailable", "UNKNOWN", "AI service temporarily unavailable");
    }
    
    private MLResponse createErrorResponse(String message, String risk, String note) {
        MLResponse empty = new MLResponse();
        empty.setMessage(message);
        
        List<MLPredictionItem> items = new ArrayList<>();
        MLPredictionItem fallbackItem = new MLPredictionItem();
        fallbackItem.setDisease(message.equals("Too many requests. Please wait.") ? "Too Many Requests" : "Unknown (Service Error)");
        fallbackItem.setIcdCode("N/A");
        fallbackItem.setRiskLevel(risk);
        fallbackItem.setClinicalNote(note);
        items.add(fallbackItem);
        
        empty.setPredictions(items);
        return empty;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Inner DTOs
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Single top prediction — used for backward-compatible DB persistence.
     */
    @Data
    public static class MLPrediction {
        private String disease;
        private String icdCode;
        private double confidence;
        private String namasteCode;
        private String namasteTerm;
        private String englishDisease;
    }

    /**
     * Phase 3: Full response container holding top-N predictions.
     */
    @Data
    public static class MLResponse {
        private String traceId;
        private String modelVersion;
        private String configVersion;
        private String message;
        private Integer latencyMs;
        private List<MLPredictionItem> predictions;
    }
}
