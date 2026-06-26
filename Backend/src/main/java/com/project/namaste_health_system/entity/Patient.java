package com.project.namaste_health_system.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "PATIENT_INFO")
public class Patient {
    @Id
    @Column(name = "PATIENT_ID",nullable = false,unique = true)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "PATIENT_NAME", nullable = false)
    private String patientName;

    @Column(name = "PATIENT_EMAIL", nullable = false)
    private String email;

    @Column(name = "PATIENT_PASSWORD",nullable = false)
    private String password;

    @Column(name = "Patient_DOB", nullable = false)
    private String userDob;

    @Column(name = "PATIENT_ADDRESS",nullable = false)
    private String address;

    @Column(name = "PATIENT_AGE", nullable = false)
    private Integer age;

    @Column(name = "MOBILE_NUMBER")
    private Long modNo;

    @Column(name = "GENDER",nullable = false)
    private String gender;

    @Column(name = "WEIGHT",nullable = false)
    private Integer weight;

}
