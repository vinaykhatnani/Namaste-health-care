package com.project.namaste_health_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PrescriptionRequest {

    @NotNull(message = "Diagnosis ID is required")
    private Long diagnosisId;

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotBlank(message = "Medicines are required")
    private String medicines;

    private String notes;
}
