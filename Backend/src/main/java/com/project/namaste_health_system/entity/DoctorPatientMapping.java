package com.project.namaste_health_system.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(indexes = {
    @Index(name = "idx_patient", columnList = "patientId"),
    @Index(name = "idx_doctor", columnList = "doctorId"),
    @Index(name = "idx_active", columnList = "active")
})
@Data
public class DoctorPatientMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId;
    private Long doctorId;

    private boolean active;

    private LocalDateTime assignedAt;
    private LocalDateTime removedAt;

    // AUDIT FIELD
    private Long changedBy;
}
