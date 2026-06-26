package com.project.namaste_health_system.entity;

import com.project.namaste_health_system.dto.MLPredictionItem;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Diagnosis entity — Phase 3 Enhancement
 * Adds transient field `mlPredictions` to carry top-3 predictions in API response
 * without altering the database schema.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "diagnoses")
public class Diagnosis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @Column(name = "symptoms", columnDefinition = "TEXT", nullable = false)
    private String symptoms;

    @Column(name = "predicted_disease")
    private String predictedDisease;

    @Column(name = "icd_code")
    private String icdCode;

    @Column(name = "icd_title")
    private String icdTitle;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // ─── Phase 6: Persisting JSON Insights for Patient View ──────────
    @Column(name = "ai_explanation_json", columnDefinition = "TEXT")
    private String aiExplanationJson;

    @Column(name = "ertc_json", columnDefinition = "TEXT")
    private String ertcJson;

    @Column(name = "insurance_json", columnDefinition = "TEXT")
    private String insuranceJson;

    // ─── Transient fields (not persisted to DB) ───────────────────────────────

    @Transient
    private String doctorName;

    @Transient
    private String hospitalName;

    @Transient
    private String medicines;

    @Transient
    private String traceId;

    @Transient
    private String modelVersion;

    /**
     * Phase 3: Top-3 ML predictions with real dynamic confidence scores (0.0–1.0).
     * Sent in the API response but NOT stored in the database.
     */
    @Transient
    private List<MLPredictionItem> mlPredictions;

    @Transient
    private Integer latencyMs;

    // Database mapped relationship for predictions
    @OneToMany(mappedBy = "diagnosis", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DiagnosisPrediction> predictions = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
