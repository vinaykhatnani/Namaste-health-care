package com.project.namaste_health_system.service;

import com.project.namaste_health_system.entity.DiseaseMapping;
import com.project.namaste_health_system.repository.DiseaseMappingRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class CodeMappingService {

    private final DiseaseMappingRepository repository;

    // Phase 4 In-Memory seed mapping
    private final Map<String, DiseaseMapping> inMemoryMapping = new HashMap<>();

    public CodeMappingService(DiseaseMappingRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    public void init() {
        // Seed the in-memory map
        addMapping("breast cancer", "NMS-C50", "2C61");
        addMapping("fever", "NMS-F01", "MG26");
        addMapping("headache", "NMS-H01", "MB41");
    }

    private void addMapping(String disease, String namaste, String icd) {
        DiseaseMapping dm = new DiseaseMapping();
        dm.setDiseaseName(disease);
        dm.setNamasteCode(namaste);
        dm.setIcd11Code(icd);
        inMemoryMapping.put(disease.toLowerCase(), dm);
    }

    public DiseaseMapping getMapping(String diseaseName) {
        if (diseaseName == null || diseaseName.isBlank()) return null;
        String normalized = diseaseName.trim().toLowerCase();

        // 1. Check database first
        Optional<DiseaseMapping> dbMapping = repository.findByDiseaseNameIgnoreCase(normalized);
        if (dbMapping.isPresent()) {
            return dbMapping.get();
        }

        // 2. Fallback to in-memory seed
        return inMemoryMapping.get(normalized);
    }
}
