package com.lms.ai.controller;

import com.lms.ai.dto.ChatRequest;
import com.lms.ai.service.AiService;
import com.lms.ai.service.KnowledgeBaseService;
import com.lms.ai.service.TextExtractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;
import com.lms.ai.dto.EvaluateAnswerRequest;
import com.lms.ai.dto.EvaluateAnswerResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/ai/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final AiService aiService;
    private final KnowledgeBaseService knowledgeBaseService;
    private final VectorStore vectorStore;
    private final com.lms.ai.client.CourseClient courseClient;

    @PostMapping("/ask")
    public ResponseEntity<String> askQuestion(@RequestBody ChatRequest request) {
        StringBuilder contextBuilder = new StringBuilder();
        boolean hasCourseContext = false;
        String moduleName = null;
        String moduleDescription = null;

        // 1. Fetch module info if moduleId is provided
        if (request.getModuleId() != null) {
            try {
                var moduleInfo = courseClient.getModuleById(request.getModuleId());
                if (moduleInfo != null) {
                    moduleName = moduleInfo.getName();
                    moduleDescription = moduleInfo.getDescription();
                }
            } catch (Exception e) {
                // Module info fetch failed, continue without it
            }

            // 2. RAG: Search in Vector Database
            List<Document> similarDocuments = vectorStore.similaritySearch(
                SearchRequest.builder()
                    .query(request.getPrompt())
                    .topK(5) // Increased from 2 for better context
                    .filterExpression("moduleId == '" + request.getModuleId() + "'")
                    .build()
            );

            if (!similarDocuments.isEmpty()) {
                hasCourseContext = true;
                contextBuilder.append("--- EXTRAITS DES SUPPORTS DE COURS ---\n");
                similarDocuments.forEach(doc -> contextBuilder.append("[Source] ").append(doc.getText()).append("\n\n"));
            }
        }

        String systemPrompt = """
            Tu es l'Assistant IA de l'EPT (École Polytechnique de Thiès), un tuteur pédagogique expert, bienveillant et précis.

            TES RÈGLES DE RÉPONSE :
            1. PRIORITÉ AUX DOCUMENTS : Si un contexte de cours est fourni ci-dessous, base tes explications PRIORITAIREMENT sur ces informations.
            2. CITATION : Mentionne naturellement quand tu utilises les supports de cours (ex: "Selon votre support de cours...", "Le document mentionne que...").
            3. TRANSPARENCE : Si la question de l'étudiant n'est pas traitée dans les documents fournis mais que tu connais la réponse, réponds avec ta culture générale tout en précisant que ce n'est pas mentionné dans le support spécifique du module.
            4. STYLE : Utilise un ton professionnel, encourageant et structure tes réponses avec du Markdown (gras, listes, blocs de code si nécessaire).
            5. LANGUE : Réponds toujours dans la langue de l'étudiant (généralement le français).

            """;

        if (moduleName != null) {
            systemPrompt += "MODULE ACTIF : " + moduleName;
            if (moduleDescription != null) {
                systemPrompt += " — " + moduleDescription;
            }
            systemPrompt += "\nL'étudiant est en mode Focus sur ce module. Réponds dans le contexte de ce module.\n\n";
        }

        if (hasCourseContext) {
            systemPrompt += "--- CONTEXTE SPÉCIFIQUE DU MODULE ---\n" + contextBuilder.toString() + "\n";
        } else if (request.getModuleId() != null) {
            systemPrompt += "NOTE : Aucun document de cours n'est indexé pour ce module. Réponds avec tes connaissances générales sur le sujet \"" + (moduleName != null ? moduleName : "module " + request.getModuleId()) + "\".\n";
        }

        String fullPrompt = systemPrompt + "\nQUESTION DE L'ÉTUDIANT :\n" + request.getPrompt();

        String response = aiService.generateContent(fullPrompt);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/index-material")
    public ResponseEntity<String> indexMaterial(@RequestParam Long materialId,
                                              @RequestParam String moduleId,
                                              @RequestParam String fileUrl) {
        knowledgeBaseService.indexMaterial(materialId, moduleId, fileUrl);
        return ResponseEntity.ok("Indexing started in background...");
    }

    @PostMapping("/generate-quiz")
    public ResponseEntity<String> generateQuiz(@RequestBody ChatRequest request) {
        StringBuilder contextBuilder = new StringBuilder();
        String moduleName = "ce module";

        // Fetch module info and RAG context
        if (request.getModuleId() != null) {
            try {
                var moduleInfo = courseClient.getModuleById(request.getModuleId());
                if (moduleInfo != null) {
                    moduleName = moduleInfo.getName();
                    if (moduleInfo.getDescription() != null) {
                        contextBuilder.append("Module : ").append(moduleName)
                                .append(" — ").append(moduleInfo.getDescription()).append("\n\n");
                    }
                }
            } catch (Exception ignored) {}

            List<Document> docs = vectorStore.similaritySearch(
                SearchRequest.builder()
                    .query("quiz questions " + moduleName)
                    .topK(2)
                    .filterExpression("moduleId == '" + request.getModuleId() + "'")
                    .build()
            );
            if (!docs.isEmpty()) {
                contextBuilder.append("CONTENU DU COURS :\n");
                int charBudget = 1500;
                for (Document doc : docs) {
                    String text = doc.getText();
                    if (text.length() > charBudget) text = text.substring(0, charBudget) + "...";
                    contextBuilder.append(text).append("\n\n");
                    charBudget -= text.length();
                    if (charBudget <= 0) break;
                }
            }
        }

        StringBuilder fullPrompt = new StringBuilder();
        fullPrompt.append("Tu es un expert pédagogique spécialiste de \"").append(moduleName).append("\".\n");
        fullPrompt.append("En te basant sur le contenu de cours suivant :\n").append(contextBuilder).append("\n\n");
        
        if (request.getContext() != null && !request.getContext().isBlank()) {
            fullPrompt.append("INSTRUCTIONS SPÉCIFIQUES :\n").append(request.getContext()).append("\n\n");
        } else {
            fullPrompt.append("Génère un quiz de 3 questions variées et pertinentes.\n");
        }

        fullPrompt.append("FORMAT JSON ATTENDU :\n")
                  .append("{\n")
                  .append("  \"title\": \"Titre\", \"description\": \"Description\",\n")
                  .append("  \"questions\": [\n")
                  .append("    { \"text\": \"...\", \"type\": \"SINGLE_CHOICE\", \"points\": ..., \"options\": [{\"text\":\"...\",\"correct\":true}, {\"text\":\"...\",\"correct\":false}] },\n")
                  .append("    { \"text\": \"...\", \"type\": \"ESSAY\", \"points\": ... }\n")
                  .append("  ]\n")
                  .append("}\n")
                  .append("- Réponds UNIQUEMENT avec le JSON valide, RIEN d'autre.\n")
                  .append("- IMPORTANT : Respecte scrupuleusement le nombre de questions demandé dans les instructions.\n");

        String fullPromptStr = fullPrompt.toString();

        String response = aiService.generateContent(fullPromptStr);
        // Extract JSON: find the first { and last }
        response = response.trim();
        int jsonStart = response.indexOf("{");
        int jsonEnd = response.lastIndexOf("}");
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
            response = response.substring(jsonStart, jsonEnd + 1);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/generate-template")
    public ResponseEntity<String> generateCourseTemplate(@RequestBody ChatRequest request) {
        String moduleName = "ce module";
        String level = "DIC2";
        String moduleDescription = "";
        String codeEC = "";
        String semester = "";
        int cmHours = 12, tdHours = 8, tpHours = 8, credits = 3;

        if (request.getModuleId() != null) {
            try {
                var moduleInfo = courseClient.getModuleById(request.getModuleId());
                if (moduleInfo != null) {
                    moduleName = moduleInfo.getName() != null ? moduleInfo.getName() : moduleName;
                    moduleDescription = moduleInfo.getDescription() != null ? moduleInfo.getDescription() : "";
                    if (moduleInfo.getLevel() != null) level = moduleInfo.getLevel();
                    if (moduleInfo.getCmHours() != null) cmHours = moduleInfo.getCmHours();
                    if (moduleInfo.getTdHours() != null) tdHours = moduleInfo.getTdHours();
                    if (moduleInfo.getTpHours() != null) tpHours = moduleInfo.getTpHours();
                    if (moduleInfo.getCodeEC() != null) codeEC = moduleInfo.getCodeEC();
                    if (moduleInfo.getSemester() != null) semester = moduleInfo.getSemester();
                }
            } catch (Exception ignored) {}
        }

        int nbCm = Math.max(1, cmHours / 2);
        int nbTd = Math.max(1, tdHours / 2);
        int nbTp = Math.max(1, tpHours / 2);
        int totalSeances = nbCm + nbTd + nbTp;
        int totalHours = cmHours + tdHours + tpHours;

        String prompt = "Tu es un expert pédagogique à l'EPT (École Polytechnique de Thiès), spécialiste du module \""
                + moduleName + "\"" + (codeEC.isBlank() ? "" : " (code : " + codeEC + ")")
                + " de niveau " + level + (semester.isBlank() ? "" : ", semestre " + semester) + ".\n"
                + (moduleDescription.isBlank() ? "" : "Description courte du module : " + moduleDescription + "\n")
                + "\nCHARGE HORAIRE : CM=" + cmHours + "h | TD=" + tdHours + "h | TP=" + tpHours + "h | Total=" + totalHours + "h\n"
                + "\nGénère un SYLLABUS COMPLET ET PROFESSIONNEL au format JSON STRICT suivant :\n"
                + "{\n"
                + "  \"moduleInfo\": {\n"
                + "    \"title\": \"" + moduleName + "\",\n"
                + "    \"code\": \"" + codeEC + "\",\n"
                + "    \"level\": \"" + level + "\",\n"
                + "    \"semester\": \"" + semester + "\",\n"
                + "    \"cmHours\": " + cmHours + ",\n"
                + "    \"tdHours\": " + tdHours + ",\n"
                + "    \"tpHours\": " + tpHours + ",\n"
                + "    \"totalHours\": " + totalHours + ",\n"
                + "    \"credits\": " + credits + "\n"
                + "  },\n"
                + "  \"description\": \"Description pédagogique complète du module en 3-4 phrases\",\n"
                + "  \"generalObjectives\": \"Objectif général du module en une phrase claire et mesurable\",\n"
                + "  \"prerequisites\": [\"Prérequis 1\", \"Prérequis 2\"],\n"
                + "  \"skills\": [\"Compétence concrète 1\", \"Compétence 2\", \"Compétence 3\", \"Compétence 4\"],\n"
                + "  \"seances\": [\n"
                + "    {\n"
                + "      \"title\": \"CM1 - Titre précis de la séance\",\n"
                + "      \"typeSeance\": \"COURS_MAGISTRAL\",\n"
                + "      \"ordre\": 1,\n"
                + "      \"duree\": 120,\n"
                + "      \"objectifs\": \"À la fin de cette séance, l'étudiant sera capable de...\",\n"
                + "      \"contenu\": \"1. Point A\\n2. Point B\\n3. Point C\"\n"
                + "    }\n"
                + "  ],\n"
                + "  \"evaluation\": {\n"
                + "    \"continu\": 40,\n"
                + "    \"examen\": 60,\n"
                + "    \"description\": \"Contrôle continu : TPs notés + quiz en ligne. Examen final : épreuve écrite de 2h.\"\n"
                + "  },\n"
                + "  \"bibliography\": [\"Auteur, Titre, Éditeur, Année\", \"Référence 2\"],\n"
                + "  \"tools\": [\"Outil ou logiciel requis\"]\n"
                + "}\n"
                + "\nRÈGLES ABSOLUMENT STRICTES :\n"
                + "- Génère exactement " + totalSeances + " séances (" + nbCm + " CM, " + nbTd + " TD, " + nbTp + " TP)\n"
                + "- typeSeance doit être EXACTEMENT : COURS_MAGISTRAL, TD, ou TP\n"
                + "- duree en minutes : 120\n"
                + "- Ordre : CM1..CM" + nbCm + " → TD1..TD" + nbTd + " → TP1..TP" + nbTp + "\n"
                + "- bibliography : 3 à 5 références réelles, pertinentes et vérifiables\n"
                + "- skills : 4 à 6 compétences concrètes avec verbes d'action\n"
                + "- prerequisites : 2 à 4 prérequis réalistes pour le niveau " + level + "\n"
                + "- Contenu des séances progressif et cohérent avec le niveau " + level + " à l'EPT\n"
                + "- Réponds UNIQUEMENT avec le JSON valide, absolument rien d'autre\n";

        if (request.getContext() != null && !request.getContext().isBlank()) {
            prompt += "\nINSTRUCTIONS SUPPLÉMENTAIRES DU PROFESSEUR :\n" + request.getContext() + "\n";
        }

        String response = aiService.generateContent(prompt);
        String trimmed = response.trim();

        // Si le service IA a retourné un message d'erreur, renvoyer 503 directement
        if (trimmed.startsWith("\u26a0") || trimmed.startsWith("\u274c") ||
            trimmed.startsWith("Aucun fournisseur") || trimmed.startsWith("Erreur") ||
            trimmed.startsWith("Cl\u00e9 API")) {
            return ResponseEntity.status(503).body(trimmed);
        }

        // Extraire le JSON proprement
        int jsonStart = trimmed.indexOf("{");
        int jsonEnd = trimmed.lastIndexOf("}");
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
            trimmed = trimmed.substring(jsonStart, jsonEnd + 1);
        }
        return ResponseEntity.ok(trimmed);
    }

    @PostMapping("/evaluate-answer")
    public ResponseEntity<?> evaluateAnswer(@RequestBody EvaluateAnswerRequest request) {
        try {
            String prompt = "Tu es un professeur strict et juste évaluant la réponse d'un étudiant à un devoir.\n" +
                    "Question : " + request.getQuestion() + "\n" +
                    "Corrigé type attendu (Justification) : " + request.getExpectedAnswer() + "\n" +
                    "Réponse de l'étudiant : " + request.getStudentAnswer() + "\n" +
                    "Note maximale possible : " + request.getMaxPoints() + "\n\n" +
                    "Tâche : Compare la réponse de l'étudiant avec le corrigé attendu. Assigne une note de 0 à " + request.getMaxPoints() + " (les demi-points sont autorisés) et rédige un court feedback justifiant la note (1 ou 2 phrases maximum).\n\n" +
                    "Tu DOIS ABSOLUMENT répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte autour, avec la structure suivante :\n" +
                    "{\n" +
                    "  \"scoreAwarded\": <nombre>,\n" +
                    "  \"feedback\": \"<texte>\"\n" +
                    "}\n";

            String response = aiService.generateContent(prompt);
            
            // Extract JSON
            int jsonStart = response.indexOf("{");
            int jsonEnd = response.lastIndexOf("}");
            if (jsonStart != -1 && jsonEnd != -1) {
                String jsonStr = response.substring(jsonStart, jsonEnd + 1);
                ObjectMapper mapper = new ObjectMapper();
                EvaluateAnswerResponse evaluation = mapper.readValue(jsonStr, EvaluateAnswerResponse.class);
                
                // Ensure score is within bounds
                if (evaluation.getScoreAwarded() == null || evaluation.getScoreAwarded() < 0) {
                    evaluation.setScoreAwarded(0.0);
                } else if (evaluation.getScoreAwarded() > request.getMaxPoints()) {
                    evaluation.setScoreAwarded(request.getMaxPoints());
                }
                
                return ResponseEntity.ok(evaluation);
            }
            
            // Fallback if AI didn't return proper JSON
            EvaluateAnswerResponse fallback = new EvaluateAnswerResponse(0.0, "Impossible d'évaluer automatiquement cette réponse.");
            return ResponseEntity.ok(fallback);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error evaluating answer: " + e.getMessage());
        }
    }
}
