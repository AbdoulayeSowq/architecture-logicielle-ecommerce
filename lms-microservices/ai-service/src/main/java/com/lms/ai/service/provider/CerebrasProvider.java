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

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class CerebrasProvider implements AiProvider {

    @Value("${ai.provider.cerebras.api-key:}")
    private String apiKey;

    @Value("${ai.provider.cerebras.url:https://api.cerebras.ai/v1/chat/completions}")
    private String apiUrl;

    @Value("${ai.provider.cerebras.model:llama3.1-8b}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getName() {
        return "Cerebras";
    }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    @SuppressWarnings("unchecked")
    public String generateContent(String prompt) throws AiProviderException {
        if (!isConfigured()) {
            throw new AiProviderException("Cerebras API key not configured", false);
        }

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", List.of(Map.of("role", "user", "content", prompt)));
            requestBody.put("max_completion_tokens", 8192);
            requestBody.put("temperature", 0.2);

            String jsonBody = objectMapper.writeValueAsString(requestBody);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            headers.setContentLength(jsonBody.getBytes(StandardCharsets.UTF_8).length);

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
            throw new AiProviderException("Empty response from Cerebras", false);
        } catch (HttpClientErrorException.TooManyRequests e) {
            log.warn("Cerebras 429 rate limit hit");
            throw new AiProviderException("Cerebras quota exceeded", e, true);
        } catch (AiProviderException e) {
            throw e;
        } catch (Exception e) {
            throw new AiProviderException("Cerebras error: " + e.getMessage(), e, false);
        }
    }
}
