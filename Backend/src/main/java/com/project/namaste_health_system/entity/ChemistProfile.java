package com.project.namaste_health_system.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "chemist_profiles")
public class ChemistProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chemist_id", nullable = false, unique = true)
    private Long chemistId;

    @Column(name = "hospital_name", nullable = false)
    private String hospitalName;
}
