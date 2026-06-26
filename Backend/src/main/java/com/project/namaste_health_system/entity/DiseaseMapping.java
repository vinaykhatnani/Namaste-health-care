package com.project.namaste_health_system.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "disease_mapping")
public class DiseaseMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "disease_name")
    private String diseaseName;

    @Column(name = "namaste_code")
    private String namasteCode;

    @Column(name = "icd11_code")
    private String icd11Code;

    private String description;
}
