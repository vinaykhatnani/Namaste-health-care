package com.project.namaste_health_system.repository;

import com.project.namaste_health_system.entity.DoctorPatientMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DoctorPatientMappingRepository extends JpaRepository<DoctorPatientMapping, Long> {
    Optional<DoctorPatientMapping> findByPatientIdAndActiveTrue(Long patientId);
    boolean existsByPatientIdAndActiveTrue(Long patientId);
    java.util.List<DoctorPatientMapping> findByDoctorIdAndActiveTrue(Long doctorId);
}
