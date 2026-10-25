package com.lms.ai.service.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class GroqProvider implements AiProvider {

    @Value("${ai.provider.groq.api-key:}")
    private String apiKey;

    @Value("${ai.provider.groq.url:https://api.groq.com/openai/v1/chat/completions}")
    private String apiUrl;

    @Value("${ai.provider.groq.model:llama-3.3-70b-versatile}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @jakarta.annotation.PostConstruct
    public void init() {
        if (isConfigured()) {
            log.info("✅ GroqProvider initialisé avec succès (Clé: {}...)", apiKey.substring(0, 8));
        } else {
            log.warn("⚠️ GroqProvider : Clé API manquante ou vide !");
        }
    }

    @Override
    public String getName() { return "Groq"; }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    @SuppressWarnings("unchecked")
    public String generateContent(String prompt) throws AiProviderException {
        if (!isConfigured()) {
            throw new AiProviderException("Groq API key non configurée", false);
        }
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", List.of(Map.of("role", "user", "content", prompt)));
            requestBody.put("max_tokens", 8192);
            requestBody.put("temperature", 0.2);

            String jsonBody = objectMapper.writeValueAsString(requestBody);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> response = restTemplate.postForObject(
                apiUrl, new HttpEntity<>(jsonBody, headers), Map.class
            );
            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
            throw new AiProviderException("Réponse vide de Groq", false);
        } catch (HttpClientErrorException.TooManyRequests e) {
            String details = e.getResponseBodyAsString();
            log.warn("Groq 429 rate limit hit: {}", details);
            throw new AiProviderException("Groq quota dépassé : " + details, e, true);
        } catch (HttpClientErrorException e) {
            String details = e.getResponseBodyAsString();
            log.error("Groq Error {}: {}", e.getStatusCode(), details);
            throw new AiProviderException("Groq error " + e.getStatusCode() + " : " + details, e, false);
        } catch (AiProviderException e) {
            throw e;
        } catch (Exception e) {
            throw new AiProviderException("Erreur Groq : " + e.getMessage(), e, false);
        }
    }
}
