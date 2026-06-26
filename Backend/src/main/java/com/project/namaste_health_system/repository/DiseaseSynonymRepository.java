package com.project.namaste_health_system.repository;

import com.project.namaste_health_system.entity.DiseaseSynonym;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DiseaseSynonymRepository extends JpaRepository<DiseaseSynonym, Long> {
    Optional<DiseaseSynonym> findByInputNameIgnoreCase(String inputName);
}
