package com.project.namaste_health_system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "dispenses")
public class Dispense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "prescription_id", nullable = false)
    private Long prescriptionId;

    @Column(name = "chemist_id", nullable = false)
    private Long chemistId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "dispensed_at")
    private LocalDateTime dispensedAt;

    @PrePersist
    protected void onCreate() {
        dispensedAt = LocalDateTime.now();
    }
}
