package com.lms.ai.service.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class OllamaProvider implements AiProvider {

    @Value("${ai.provider.ollama.url:http://localhost:11434/v1/chat/completions}")
    private String apiUrl;

    @Value("${ai.provider.ollama.model:llama3.2}")
    private String model;

    @Value("${ai.provider.ollama.enabled:true}")
    private boolean enabled;

    private final RestTemplate restTemplate = buildRestTemplate();

    private static RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);       // 5s de connexion
        factory.setReadTimeout(180_000);        // 3min pour la génération
        return new RestTemplate(factory);
    }
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getName() { return "Ollama"; }

    public String getModel() { return model; }

    @Override
    public boolean isConfigured() {
        if (!enabled) return false;
        try {
            restTemplate.getForObject("http://localhost:11434/api/tags", String.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public String generateContent(String prompt) throws AiProvider.AiProviderException {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", List.of(Map.of("role", "user", "content", prompt)));
            requestBody.put("temperature", 0.2);
            requestBody.put("stream", false);
            requestBody.put("max_tokens", 4096);

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> response = restTemplate.postForObject(
                apiUrl, new HttpEntity<>(jsonBody, headers), Map.class
            );
            // Détecter les erreurs retournées par Ollama dans le body (ex: modèle non trouvé)
            if (response != null && response.containsKey("error")) {
                Map<String, Object> error = (Map<String, Object>) response.get("error");
                String errMsg = error != null ? String.valueOf(error.get("message")) : "Erreur inconnue Ollama";
                throw new AiProvider.AiProviderException("Ollama : " + errMsg + ". Lancez 'ollama pull " + model + "'", false);
            }
            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
            throw new AiProvider.AiProviderException("Réponse vide d'Ollama", false);
        } catch (ResourceAccessException e) {
            throw new AiProvider.AiProviderException("Ollama inaccessible. Lancez 'ollama serve'.", e, false);
        } catch (AiProvider.AiProviderException e) {
            throw e;
        } catch (Exception e) {
            throw new AiProvider.AiProviderException("Erreur Ollama : " + e.getMessage(), e, false);
        }
    }
}
