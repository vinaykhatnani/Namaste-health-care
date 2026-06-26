package com.project.namaste_health_system.repository;

import com.project.namaste_health_system.entity.AyuCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface AyuRepository extends JpaRepository<AyuCode, Long> {
    List<AyuCode> findByDiseaseNameContainingIgnoreCase(String name);
}
