package com.lms.ai.controller;

import com.lms.ai.service.AiService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/proctoring")
@RequiredArgsConstructor
public class ProctoringController {

    private final AiService aiService;

    @Data
    public static class ProctoringAnalysisRequest {
        private String studentUsername;
        private String quizTitle;
        private Integer tabSwitchCount;
        private Integer mouseExitCount;
        private Long durationSeconds;
        private Integer totalQuestions;
        private String studentNotes;
    }

    @PostMapping("/analyze")
    public ResponseEntity<String> analyzeIntegrity(@RequestBody ProctoringAnalysisRequest request) {
        String prompt = "Tu es un expert en intégrité académique numérique.\n" +
                "Analyse les données de surveillance d'un étudiant pendant un quiz :\n" +
                "- Étudiant : " + request.getStudentUsername() + "\n" +
                "- Quiz : " + request.getQuizTitle() + "\n" +
                "- Changements d'onglets : " + request.getTabSwitchCount() + "\n" +
                "- Sorties de souris : " + request.getMouseExitCount() + "\n" +
                "- Durée : " + request.getDurationSeconds() + " secondes\n" +
                "- Nombre de questions : " + request.getTotalQuestions() + "\n\n" +
                "Tâche : Évalue le risque de triche sur une échelle de 0 (aucun) à 100 (certitude).\n" +
                "Fournis un verdict clair et une justification pédagogique.\n" +
                "Structure ta réponse en JSON :\n" +
                "{\n" +
                "  \"riskScore\": <nombre>,\n" +
                "  \"verdict\": \"<Faible|Modéré|Élevé|Critique>\",\n" +
                "  \"analysis\": \"<explication courte>\"\n" +
                "}\n" +
                "Réponds UNIQUEMENT avec le JSON.";

        String response = aiService.generateContent(prompt);
        
        // Extract JSON
        int jsonStart = response.indexOf("{");
        int jsonEnd = response.lastIndexOf("}");
        if (jsonStart != -1 && jsonEnd > jsonStart) {
            response = response.substring(jsonStart, jsonEnd + 1);
        }
        
        return ResponseEntity.ok(response);
    }
}
