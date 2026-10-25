package com.lms.ai.controller;

import com.lms.ai.client.CourseClient;
import com.lms.ai.service.AiService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/adaptive")
@RequiredArgsConstructor
@Slf4j
public class AdaptiveController {

    private final AiService aiService;
    private final VectorStore vectorStore;
    private final CourseClient courseClient;

    @Data
    public static class GenerateQuestionRequest {
        private Long moduleId;
        private String difficulty;           // EASY | MEDIUM | HARD
        private String competence;           // Compétence faible ciblée (lacune)
        private List<String> lacunes;        // Toutes les lacunes de l'étudiant
        private List<String> previousQuestions; // Textes déjà posés (anti-répétition)
        private Double sessionScorePercent;  // Score courant (pour contextualiser la difficulté)
    }

    @Data
    public static class SessionRecommendationRequest {
        private Long moduleId;
        private Double scorePercent;
        private Integer answeredCount;
        private Integer correctCount;
        private List<String> lacunes;
        private List<String> strongCompetences;
        private String studentLevel; // DIC1, DIC2, etc.
    }

    @PostMapping("/generate-question")
    public ResponseEntity<String> generateQuestion(@RequestBody GenerateQuestionRequest request) {
        String moduleName = "ce module";
        String moduleDescription = "";
        String moduleLevel = "";

        if (request.getModuleId() != null) {
            try {
                var moduleInfo = courseClient.getModuleById(request.getModuleId());
                if (moduleInfo != null) {
                    moduleName = moduleInfo.getName() != null ? moduleInfo.getName() : moduleName;
                    moduleDescription = moduleInfo.getDescription() != null ? moduleInfo.getDescription() : "";
                    moduleLevel = moduleInfo.getLevel() != null ? moduleInfo.getLevel() : "";
                }
            } catch (Exception ignored) {}
        }

        // RAG : chercher extraits du cours sur la compétence ciblée
        StringBuilder ragContext = new StringBuilder();
        String ragQuery = (request.getCompetence() != null && !request.getCompetence().isBlank())
                ? request.getCompetence() + " " + moduleName
                : moduleName;
        try {
            List<Document> docs = vectorStore.similaritySearch(
                SearchRequest.builder()
                    .query(ragQuery)
                    .topK(3)
                    .filterExpression("moduleId == '" + request.getModuleId() + "'")
                    .build()
            );
            if (!docs.isEmpty()) {
                ragContext.append("EXTRAITS DES SUPPORTS DE COURS :\n");
                int budget = 1200;
                for (Document d : docs) {
                    String txt = d.getText().length() > budget ? d.getText().substring(0, budget) + "..." : d.getText();
                    ragContext.append("- ").append(txt).append("\n");
                    budget -= txt.length();
                    if (budget <= 0) break;
                }
            }
        } catch (Exception e) {
            log.debug("RAG unavailable for adaptive question: {}", e.getMessage());
        }

        String difficultyLabel = switch (request.getDifficulty() != null ? request.getDifficulty() : "EASY") {
            case "HARD" -> "difficile — concepts avancés, analyse, synthèse, cas complexes";
            case "MEDIUM" -> "intermédiaire — application pratique et compréhension approfondie";
            default -> "facile — définitions, concepts fondamentaux, reconnaissance";
        };

        StringBuilder prompt = new StringBuilder();
        prompt.append("Tu es un expert pédagogique en \"").append(moduleName).append("\"");
        if (!moduleDescription.isBlank()) prompt.append(" (").append(moduleDescription).append(")");
        if (!moduleLevel.isBlank()) prompt.append(" pour le niveau ").append(moduleLevel);
        prompt.append(".\n\n");

        if (ragContext.length() > 0) {
            prompt.append(ragContext).append("\n");
        }

        prompt.append("CONTEXTE ÉTUDIANT :\n");
        prompt.append("- Niveau de difficulté courant : ").append(difficultyLabel).append("\n");
        if (request.getSessionScorePercent() != null) {
            prompt.append("- Score actuel dans la session : ").append(String.format("%.0f", request.getSessionScorePercent())).append("%\n");
        }
        if (request.getLacunes() != null && !request.getLacunes().isEmpty()) {
            prompt.append("- Lacunes identifiées de l'étudiant : ").append(String.join(", ", request.getLacunes())).append("\n");
        }
        if (request.getCompetence() != null && !request.getCompetence().isBlank()) {
            prompt.append("- Compétence PRIORITAIRE à cibler pour cette question : **").append(request.getCompetence()).append("**\n");
        }

        if (request.getPreviousQuestions() != null && !request.getPreviousQuestions().isEmpty()) {
            prompt.append("\nSujets déjà posés à ÉVITER (ne pas répéter) :\n");
            request.getPreviousQuestions().stream().limit(6)
                .forEach(q -> prompt.append("- ").append(q).append("\n"));
        }

        prompt.append("\nMISSION : Génère UNE SEULE question QCM adaptée au profil de l'étudiant.\n")
              .append("FORMAT JSON STRICT (rien d'autre) :\n")
              .append("{\n")
              .append("  \"text\": \"La question précise et pédagogique\",\n")
              .append("  \"competence\": \"NomCompétenceCiblée\",\n")
              .append("  \"justification\": \"Explication pédagogique de la bonne réponse (1-2 phrases)\",\n")
              .append("  \"options\": [\n")
              .append("    {\"text\": \"Réponse correcte\", \"correct\": true},\n")
              .append("    {\"text\": \"Distracteur A\", \"correct\": false},\n")
              .append("    {\"text\": \"Distracteur B\", \"correct\": false},\n")
              .append("    {\"text\": \"Distracteur C\", \"correct\": false}\n")
              .append("  ]\n")
              .append("}\n")
              .append("RÈGLES ABSOLUES : exactement 4 options, 1 seule correcte, distracteurs plausibles, JSON valide uniquement.");

        String response = aiService.generateContent(prompt.toString());
        response = response.trim();
        int start = response.indexOf("{");
        int end = response.lastIndexOf("}");
        if (start >= 0 && end > start) {
            response = response.substring(start, end + 1);
        }
        log.info("AI generated adaptive question for module={} difficulty={} competence={}",
                request.getModuleId(), request.getDifficulty(), request.getCompetence());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/session-recommendations")
    public ResponseEntity<String> sessionRecommendations(@RequestBody SessionRecommendationRequest request) {
        String moduleName = "ce module";
        try {
            var m = courseClient.getModuleById(request.getModuleId());
            if (m != null && m.getName() != null) moduleName = m.getName();
        } catch (Exception ignored) {}

        // RAG sur les lacunes pour proposer des ressources pertinentes
        StringBuilder ragContext = new StringBuilder();
        if (request.getLacunes() != null && !request.getLacunes().isEmpty()) {
            try {
                List<Document> docs = vectorStore.similaritySearch(
                    SearchRequest.builder()
                        .query(String.join(" ", request.getLacunes()))
                        .topK(3)
                        .filterExpression("moduleId == '" + request.getModuleId() + "'")
                        .build()
                );
                if (!docs.isEmpty()) {
                    ragContext.append("EXTRAITS DU COURS PERTINENTS :\n");
                    int budget = 800;
                    for (Document d : docs) {
                        String txt = d.getText().length() > budget ? d.getText().substring(0, budget) + "..." : d.getText();
                        ragContext.append("- ").append(txt).append("\n");
                        budget -= txt.length();
                        if (budget <= 0) break;
                    }
                }
            } catch (Exception ignored) {}
        }

        double score = request.getScorePercent() != null ? request.getScorePercent() : 0;
        int correct = request.getCorrectCount() != null ? request.getCorrectCount() : 0;
        int total = request.getAnsweredCount() != null ? request.getAnsweredCount() : 0;

        String prompt = "Tu es un tuteur pédagogique expert et bienveillant à l'EPT (École Polytechnique de Thiès).\n\n"
            + "Un étudiant vient de terminer un **parcours adaptatif** sur le module **\"" + moduleName + "\"**.\n\n"
            + "📊 RÉSULTATS :\n"
            + "- Score : " + String.format("%.1f", score) + "% (" + correct + "/" + total + " questions correctes)\n"
            + (request.getStudentLevel() != null ? "- Niveau : " + request.getStudentLevel() + "\n" : "")
            + (request.getLacunes() != null && !request.getLacunes().isEmpty()
                ? "- ⚠️ Lacunes identifiées : " + String.join(", ", request.getLacunes()) + "\n"
                : "- ✅ Aucune lacune majeure détectée\n")
            + (request.getStrongCompetences() != null && !request.getStrongCompetences().isEmpty()
                ? "- 💪 Points forts : " + String.join(", ", request.getStrongCompetences()) + "\n"
                : "")
            + (ragContext.length() > 0 ? "\n" + ragContext + "\n" : "")
            + "\nGénère un **bilan personnalisé et motivant** structuré ainsi :\n"
            + "## 📊 Bilan\n(2-3 phrases sur la performance globale)\n\n"
            + "## 🎯 Points à renforcer\n(Pour chaque lacune : explication concise + conseil pratique)\n\n"
            + "## 🚀 Prochaines étapes\n(3 actions concrètes et réalisables pour progresser)\n\n"
            + "## 💡 Le conseil du tuteur\n(1 message encourageant et personnalisé)\n\n"
            + "Réponds en français avec du Markdown. Maximum 400 mots. Sois précis, actionnable et encourageant.";

        String response = aiService.generateContent(prompt);
        return ResponseEntity.ok(response);
    }
}
