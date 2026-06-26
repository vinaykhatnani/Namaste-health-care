package com.project.namaste_health_system.repository;

import com.project.namaste_health_system.entity.DispenseIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DispenseIssueRepository extends JpaRepository<DispenseIssue, Long> {
    List<DispenseIssue> findByChemistId(Long chemistId);
    List<DispenseIssue> findByPrescriptionId(Long prescriptionId);
    List<DispenseIssue> findAllByOrderByCreatedAtDesc();
}
