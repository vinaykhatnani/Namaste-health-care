package com.project.namaste_health_system.service;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;


import java.util.Map;

@Service
public class ICDAuthService {

    @Value("${icd.client.id}")
    private String clientId;

    @Value("${icd.client.secret}")
    private String clientSecret;

    public String getToken() {

        RestTemplate rest = new RestTemplate();

        String url = "https://icdaccessmanagement.who.int/connect/token";

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("scope", "icdapi_access");
        body.add("grant_type", "client_credentials");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> req = new HttpEntity<>(body, headers);

        ResponseEntity<Map> res = rest.postForEntity(url, req, Map.class);

        if (res.getBody() != null && res.getBody().get("access_token") != null) {
            return res.getBody().get("access_token").toString();
        }

        throw new RuntimeException("Failed to get ICD token");
    }
}