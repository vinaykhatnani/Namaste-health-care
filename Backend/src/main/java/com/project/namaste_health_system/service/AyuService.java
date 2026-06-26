package com.project.namaste_health_system.service;

import com.project.namaste_health_system.entity.AyuCode;
import com.project.namaste_health_system.repository.AyuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AyuService {

    @Autowired
    private AyuRepository repo;

    public String getAyu(String term) {
        return repo.findByDiseaseNameContainingIgnoreCase(term)
                .stream()
                .findFirst()
                .map(AyuCode::getAyuCode)
                .orElse("NOT_FOUND");
    }
}
