package com.project.namaste_health_system.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "doctor_profiles")
public class DoctorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doctor_id", nullable = false, unique = true)
    private Long doctorId;

    @Column(name = "hospital_name", nullable = false)
    private String hospitalName;

    @Column(name = "experience", nullable = false)
    private Integer experience;

    @Column(name = "specialization", nullable = false)
    private String specialization;
}
