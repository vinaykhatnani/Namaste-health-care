package com.project.namaste_health_system.service;

import com.project.namaste_health_system.dto.MLPredictionItem;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class ExplanationService {

    /**
     * Extracts and builds the explanation directly from the ML engine's semantic matching.
     * We pass through the AI-generated semantic match rather than downgrading to basic string matching.
     */
    public Map<String, String> build(MLPredictionItem predictionItem) {
        if (predictionItem == null) return null;
        return predictionItem.getExplanation(); // Returns the ML-generated semantic explanation
    }
}
