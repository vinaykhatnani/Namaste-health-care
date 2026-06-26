package com.project.namaste_health_system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Phase 3: DTO representing a single ML prediction entry from the predictions[] array.
 * Used in MLResponse to carry the full top-3 list.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MLPredictionItem {
    private String disease;
    private String icdCode;
    private double confidence;
    private String confidenceLabel;
    private String riskLevel;
    private String clinicalNote;
    private java.util.Map<String, Double> confidenceBreakdown;
    private String namasteCode;
    private String namasteTerm;
    private String englishDisease;
    private boolean isRelative;
    private java.util.List<String> matchedSymptoms;
    private java.util.Map<String, String> explanation;
    private java.util.Map<String, String> codeExplanation;
    private java.util.Map<String, Object> insuranceInsights;
    private java.util.Map<String, Object> ertcInsights;
}
