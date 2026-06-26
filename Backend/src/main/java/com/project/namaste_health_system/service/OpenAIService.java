package com.project.namaste_health_system.service;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenAIService {

    @Value("${openai.api.key}")
    private String apiKey;

    public String getSuggestion(String symptom) {

        RestTemplate rest = new RestTemplate();

        String url = "https://api.openai.com/v1/chat/completions";

        // Headers
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Request Body (NO STRING JSON)
        Map<String, Object> request = new HashMap<>();
        request.put("model", "gpt-4o-mini");

        List<Map<String, String>> messages = new ArrayList<>();

        Map<String, String> msg = new HashMap<>();
        msg.put("role", "user");
        msg.put("content", "Suggest possible disease for: " + symptom);

        messages.add(msg);
        request.put("messages", messages);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        ResponseEntity<Map> res = rest.postForEntity(url, entity, Map.class);

        // Extract clean response
        if (res.getBody() != null) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) res.getBody().get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            return message.get("content").toString();
        }

        return "No response";
    }
}