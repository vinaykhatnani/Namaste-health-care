package com.project.namaste_health_system.repository;

import com.project.namaste_health_system.entity.Diagnosis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiagnosisRepository extends JpaRepository<Diagnosis, Long> {
    List<Diagnosis> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Diagnosis> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    List<Diagnosis> findAllByOrderByCreatedAtDesc();
    long countByDoctorId(Long doctorId);

    @Query("SELECT d.predictedDisease, COUNT(d) FROM Diagnosis d GROUP BY d.predictedDisease ORDER BY COUNT(d) DESC")
    List<Object[]> getDiseaseFrequency();

    @Query("SELECT d.icdCode, COUNT(d) FROM Diagnosis d WHERE d.icdCode IS NOT NULL GROUP BY d.icdCode ORDER BY COUNT(d) DESC")
    List<Object[]> getIcdUsage();
}
