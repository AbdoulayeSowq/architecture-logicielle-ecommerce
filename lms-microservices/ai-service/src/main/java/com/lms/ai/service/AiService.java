package com.lms.ai.service;

import com.lms.ai.service.provider.AiProvider.AiProviderException;
import com.lms.ai.service.provider.GroqProvider;
import com.lms.ai.service.provider.OllamaProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class AiService {

    private final GroqProvider groqProvider;
    private final OllamaProvider ollamaProvider;

    public String generateContent(String prompt) {
        StringBuilder errorLog = new StringBuilder();

        // 1. Essayer Groq (Priorité 1)
        if (groqProvider.isConfigured()) {
            try {
                return groqProvider.generateContent(prompt);
            } catch (AiProviderException e) {
                errorLog.append("Groq: ").append(e.getMessage()).append(" | ");
                log.error("❌ Groq échoué : {}", e.getMessage());
            }
        } else {
            errorLog.append("Groq non configuré | ");
        }

        // 2. Fallback sur Ollama (Local)
        if (ollamaProvider.isConfigured()) {
            try {
                log.info("🔄 Tentative de fallback sur Ollama...");
                return ollamaProvider.generateContent(prompt);
            } catch (AiProviderException e) {
                errorLog.append("Ollama: ").append(e.getMessage()).append(" | ");
                log.error("❌ Ollama échoué : {}", e.getMessage());
            }
        } else {
            errorLog.append("Ollama non disponible | ");
        }

        return "❌ Services IA indisponibles. Erreurs : " + errorLog.toString();
    }
}
