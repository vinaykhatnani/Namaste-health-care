package com.project.namaste_health_system.repository;

import com.project.namaste_health_system.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByDiagnosisId(Long diagnosisId);
    List<Prescription> findByPatientId(Long patientId);
    List<Prescription> findByStatus(Prescription.PrescriptionStatus status);
    List<Prescription> findAllByOrderByCreatedAtDesc();
    long countByStatus(Prescription.PrescriptionStatus status);
    List<Prescription> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    long countByDoctorId(Long doctorId);
    long countByDoctorIdAndStatus(Long doctorId, Prescription.PrescriptionStatus status);
}
