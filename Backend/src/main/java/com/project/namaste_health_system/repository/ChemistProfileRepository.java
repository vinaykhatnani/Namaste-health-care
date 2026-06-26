package com.project.namaste_health_system.repository;

import com.project.namaste_health_system.entity.ChemistProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChemistProfileRepository extends JpaRepository<ChemistProfile, Long> {
    Optional<ChemistProfile> findByChemistId(Long chemistId);
}
