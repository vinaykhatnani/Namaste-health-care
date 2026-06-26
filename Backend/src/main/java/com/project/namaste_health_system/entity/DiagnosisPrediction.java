package com.project.namaste_health_system.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "diagnosis_predictions")
@Data
public class DiagnosisPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diagnosis_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Diagnosis diagnosis;

    @Column(nullable = false)
    private String disease;

    @Column(name = "icd_code")
    private String icdCode;

    @Column(nullable = false)
    private double confidence;
}
