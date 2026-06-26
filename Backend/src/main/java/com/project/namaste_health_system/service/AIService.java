package com.project.namaste_health_system.service;

import org.springframework.stereotype.Service;

@Service
public class AIService {

    public String suggest(String term) {

        term = term.toLowerCase();

        if(term.contains("fever")) return "Possible Infection";
        if(term.contains("cough")) return "Respiratory Issue";
        if(term.contains("headache")) return "Migraine or Stress";

        return "Consult Doctor";
    }
}
