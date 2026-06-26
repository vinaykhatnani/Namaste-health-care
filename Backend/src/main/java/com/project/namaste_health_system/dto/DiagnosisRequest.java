package com.project.namaste_health_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DiagnosisRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotBlank(message = "Symptoms are required")
    private String symptoms;

    // Phase 1: Doctor's optional disease input in local language (Marathi/Hindi/English).
    // Will be used in future phases for language normalization and AI fusion.
    private String diseaseName;

    // Language code for diseaseName: "en" (default), "mr" (Marathi), "hi" (Hindi)
    private String language;

    private String severity;
    private String duration;

    /**
     * Returns the language code, defaulting to "en" if null or blank.
     */
    public String getLanguage() {
        return (language == null || language.isBlank()) ? "en" : language;
    }
}
