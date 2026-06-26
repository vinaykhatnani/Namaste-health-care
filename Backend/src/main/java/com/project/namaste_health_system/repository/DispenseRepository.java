package com.project.namaste_health_system.repository;

import com.project.namaste_health_system.entity.Dispense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DispenseRepository extends JpaRepository<Dispense, Long> {
    List<Dispense> findByChemistId(Long chemistId);
    Optional<Dispense> findByPrescriptionId(Long prescriptionId);
}
