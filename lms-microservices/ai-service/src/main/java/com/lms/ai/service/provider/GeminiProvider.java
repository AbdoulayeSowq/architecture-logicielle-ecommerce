package com.lms.ai.service.provider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class GeminiProvider implements AiProvider {

    private final GoogleGenAiChatModel chatModel;

    @Value("${spring.ai.google.genai.api-key:}")
    private String apiKey;

    @Override
    public String getName() {
        return "Gemini";
    }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("AIza-votre-cle");
    }

    @Override
    public String generateContent(String prompt) throws AiProviderException {
        if (!isConfigured()) {
            throw new AiProviderException("Gemini API key not configured", false);
        }

        try {
            return chatModel.call(prompt);
        } catch (Exception e) {
            log.error("Gemini error: {}", e.getMessage());
            throw new AiProviderException("Gemini error: " + e.getMessage(), e, false);
        }
    }
}
