package com.project.namaste_health_system.repository;

import com.project.namaste_health_system.entity.DiagnosisPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DiagnosisPredictionRepository extends JpaRepository<DiagnosisPrediction, Long> {
}
