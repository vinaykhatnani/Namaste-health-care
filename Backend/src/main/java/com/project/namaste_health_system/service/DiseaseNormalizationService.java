package com.project.namaste_health_system.service;

import com.project.namaste_health_system.entity.DiseaseSynonym;
import com.project.namaste_health_system.repository.DiseaseSynonymRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class DiseaseNormalizationService {

    @Autowired
    private DiseaseSynonymRepository repository;

    private static final Map<String, String> translationMap = new HashMap<>();

    static {
        // Translation mappings for Phase 4.1
        translationMap.put("स्तन कैंसर", "breast cancer");
        translationMap.put("ब्रेस्ट में गांठ", "breast lump");
        translationMap.put("कैंसर", "cancer");
        translationMap.put("ताप", "fever");
        translationMap.put("ज्वर", "fever");
    }

    public String normalizeDisease(String input) {
        if (input == null || input.trim().isEmpty()) {
            return null;
        }

        String lowerInput = input.trim().toLowerCase();

        // 1. Check direct translation map
        if (translationMap.containsKey(lowerInput)) {
            return translationMap.get(lowerInput);
        }
        if (translationMap.containsKey(input.trim())) {
            return translationMap.get(input.trim());
        }

        // 2. Check Synonym Database
        return repository.findByInputNameIgnoreCase(lowerInput)
                .map(DiseaseSynonym::getStandardName)
                .orElse(lowerInput);
    }
}
