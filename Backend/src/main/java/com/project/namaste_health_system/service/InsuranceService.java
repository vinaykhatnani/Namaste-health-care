package com.project.namaste_health_system.service;

import com.project.namaste_health_system.dto.MLPredictionItem;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class InsuranceService {

    /**
     * Extracts and builds the Insurance / ERTC insights directly from the ML engine.
     * Keeps Python as the source of truth for dynamic AI insights.
     */
    public Map<String, Object> buildInsurance(MLPredictionItem predictionItem) {
        if (predictionItem == null) return null;
        return predictionItem.getInsuranceInsights();
    }
    
    public Map<String, Object> buildERTC(MLPredictionItem predictionItem) {
        if (predictionItem == null) return null;
        return predictionItem.getErtcInsights();
    }
}
