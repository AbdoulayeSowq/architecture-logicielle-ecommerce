package com.lms.ai.controller;

import com.lms.ai.client.CourseClient;
import com.lms.ai.dto.RemediationRequest;
import com.lms.ai.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai/remediation")
@RequiredArgsConstructor
@Slf4j
public class RemediationController {

    private final AiService aiService;
    private final VectorStore vectorStore;
    private final CourseClient courseClient;

    @PostMapping("/generate")
    public ResponseEntity<String> generateRemediation(@RequestBody RemediationRequest request) {

        String moduleName = "ce module";
        String level = "DIC";

        // 1. Récupérer infos du module
        try {
            var moduleInfo = courseClient.getModuleById(request.getModuleId());
            if (moduleInfo != null) {
                moduleName = moduleInfo.getName() != null ? moduleInfo.getName() : moduleName;
                level = moduleInfo.getLevel() != null ? moduleInfo.getLevel() : level;
            }
        } catch (Exception ignored) {}

        // 2. Regrouper les questions ratées par compétence
        Map<String, List<RemediationRequest.WrongQuestion>> byCompetence = new LinkedHashMap<>();
        if (request.getWrongQuestions() != null) {
            for (RemediationRequest.WrongQuestion wq : request.getWrongQuestions()) {
                String comp = wq.getCompetence() != null ? wq.getCompetence() : "Général";
                byCompetence.computeIfAbsent(comp, k -> new ArrayList<>()).add(wq);
            }
        }

        // 3. Pour chaque compétence : RAG + génération d'explication
        StringBuilder parcoursJson = new StringBuilder();
        parcoursJson.append("{\n");
        parcoursJson.append("  \"moduleId\": ").append(request.getModuleId()).append(",\n");
        parcoursJson.append("  \"moduleName\": \"").append(moduleName).append("\",\n");
        parcoursJson.append("  \"quizTitle\": \"").append(request.getQuizTitle() != null ? request.getQuizTitle() : "Quiz").append("\",\n");
        parcoursJson.append("  \"parcours\": [\n");

        List<String> parcoursItems = new ArrayList<>();

        for (Map.Entry<String, List<RemediationRequest.WrongQuestion>> entry : byCompetence.entrySet()) {
            String competence = entry.getKey();
            List<RemediationRequest.WrongQuestion> questions = entry.getValue();

            // RAG — chercher extraits pertinents du cours
            StringBuilder ragContext = new StringBuilder();
            try {
                List<Document> docs = vectorStore.similaritySearch(
                    SearchRequest.builder()
                        .query(competence + " " + questions.stream()
                            .map(RemediationRequest.WrongQuestion::getQuestionText)
                            .collect(Collectors.joining(" ")))
                        .topK(3)
                        .filterExpression("moduleId == '" + request.getModuleId() + "'")
                        .build()
                );
                if (!docs.isEmpty()) {
                    ragContext.append("EXTRAITS DU COURS :\n");
                    docs.forEach(doc -> ragContext.append("- ").append(doc.getText()).append("\n"));
                }
            } catch (Exception e) {
                log.warn("RAG search failed for competence {}: {}", competence, e.getMessage());
            }

            // Questions ratées pour le prompt
            StringBuilder wrongQuestionsText = new StringBuilder();
            for (RemediationRequest.WrongQuestion wq : questions) {
                wrongQuestionsText.append("• ").append(wq.getQuestionText()).append("\n");
                if (wq.getJustification() != null) {
                    wrongQuestionsText.append("  → Explication : ").append(wq.getJustification()).append("\n");
                }
            }

            // Prompt de remédiation
            String prompt = "Tu es un tuteur pédagogique expert à l'EPT (École Polytechnique de Thiès), niveau " + level + ".\n\n"
                + "Un étudiant a échoué au quiz \"" + request.getQuizTitle() + "\" sur le module \"" + moduleName + "\".\n"
                + "Il a des difficultés avec la compétence : **" + competence + "**\n\n"
                + "QUESTIONS QU'IL A RATÉES :\n" + wrongQuestionsText + "\n"
                + (ragContext.length() > 0 ? ragContext + "\n" : "")
                + "MISSION : Génère une explication pédagogique claire, structurée et encourageante pour l'aider à comprendre "
                + "la notion \"" + competence + "\". Utilise des exemples concrets, des analogies si besoin. "
                + "Structure ta réponse avec : 1) Rappel de la notion, 2) Explication des erreurs, 3) Exemple pratique, 4) Astuce pour retenir.\n"
                + "Réponds en français avec du Markdown. Maximum 400 mots.";

            String explication = aiService.generateContent(prompt);

            // Construire l'item JSON (escape les guillemets)
            String itemJson = "    {\n"
                + "      \"competence\": " + jsonString(competence) + ",\n"
                + "      \"nombreQuestions\": " + questions.size() + ",\n"
                + "      \"explication\": " + jsonString(explication) + "\n"
                + "    }";
            parcoursItems.add(itemJson);
        }

        parcoursJson.append(String.join(",\n", parcoursItems));
        parcoursJson.append("\n  ]\n}");

        return ResponseEntity.ok(parcoursJson.toString());
    }

    private String jsonString(String s) {
        if (s == null) return "\"\"";
        return "\"" + s.replace("\\", "\\\\")
                       .replace("\"", "\\\"")
                       .replace("\n", "\\n")
                       .replace("\r", "")
                       .replace("\t", "  ") + "\"";
    }
}
