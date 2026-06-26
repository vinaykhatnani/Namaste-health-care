package com.project.namaste_health_system.repository;

import com.project.namaste_health_system.entity.DiseaseMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiseaseMappingRepository extends JpaRepository<DiseaseMapping, Long> {
    Optional<DiseaseMapping> findByDiseaseNameIgnoreCase(String diseaseName);
}
