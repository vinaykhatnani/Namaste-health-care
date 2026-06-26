package com.project.namaste_health_system.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "patient_profiles")
public class PatientProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "date_of_birth")
    private String dateOfBirth;

    @Column
    private String address;

    @Column
    private Integer age;

    @Column
    private String gender;

    @Column
    private Integer weight;

    @Column(name = "mobile_number")
    private String mobileNumber;
}
