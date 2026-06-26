package com.project.namaste_health_system.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class ICDService {

    private static final Logger logger = LoggerFactory.getLogger(ICDService.class);

    @Value("${icd.client.id}")
    private String clientId;

    @Value("${icd.client.secret}")
    private String clientSecret;

    @Value("${icd.token.url:https://icdaccessmanagement.who.int/connect/token}")
    private String tokenEndpoint;

    @Value("${icd.api.url:https://id.who.int/icd/release/11/2024-01/mms/search}")
    private String apiEndpoint;

    private final RestTemplate restTemplate;
    private final java.util.concurrent.ConcurrentHashMap<String, ICDResult> lookupCache = new java.util.concurrent.ConcurrentHashMap<>();

    public ICDService(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(3))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
    }

    private String cachedToken = null;
    private long tokenExpiresAt = 0;

    private String getValidToken() {
        if (cachedToken != null && System.currentTimeMillis() < tokenExpiresAt) {
            return cachedToken;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth(clientId, clientSecret);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "client_credentials");
            body.add("scope", "icdapi_access");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(tokenEndpoint, request, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                cachedToken = (String) response.getBody().get("access_token");
                Integer expiresIn = (Integer) response.getBody().get("expires_in");
                tokenExpiresAt = System.currentTimeMillis() + (expiresIn * 1000L) - 60000;
                logger.info("Retrieved new ICD-11 token, expires in {}s", expiresIn);
                return cachedToken;
            }
        } catch (Exception e) {
            logger.error("Failed to fetch WHO ICD-11 token: {}", e.getMessage());
        }
        return null;
    }

    public ICDResult lookupDisease(String query) {
        if (query == null || query.isBlank()) return null;

        if (lookupCache.containsKey(query.toLowerCase())) {
            return lookupCache.get(query.toLowerCase());
        }

        String token = getValidToken();
        if (token == null) return null;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.set("Accept", "application/json");
            headers.set("API-Version", "v2");
            headers.set("Accept-Language", "en");

            String url = apiEndpoint + "?q=" + query.replace(" ", "%20") + "&useFlexisearch=true&flatResults=false";
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> data = response.getBody();
                List<Map<String, Object>> destinationEntities = (List<Map<String, Object>>) data.get("destinationEntities");
                if (destinationEntities != null && !destinationEntities.isEmpty()) {
                    Map<String, Object> bestMatch = destinationEntities.get(0);
                    String theCode = (String) bestMatch.get("theCode");
                    String title = (String) bestMatch.get("title");

                    // Filter out non-leaf codes like "BlockL1-01" or empty codes
                    if (theCode != null && !theCode.isBlank() && !theCode.startsWith("Block")) {
                        ICDResult result = new ICDResult(theCode, title.replaceAll("<[^>]*>", ""));
                        lookupCache.put(query.toLowerCase(), result);
                        return result;
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("WHO ICD-11 API search failed for '{}': {}", query, e.getMessage());
        }

        // Return fallback N/A if everything fails
        return ICDResult.fallback(query);
    }

    private String extractTitle(Object titleObj) {
        if (titleObj instanceof Map) {
            return (String) ((Map<?, ?>) titleObj).get("@value");
        }
        return titleObj != null ? titleObj.toString() : null;
    }

    public record ICDResult(String code, String title) {
        public static ICDResult fallback(String disease) {
            return new ICDResult("N/A", disease);
        }
    }
}
