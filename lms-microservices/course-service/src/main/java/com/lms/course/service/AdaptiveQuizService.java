package com.lms.course.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.course.client.AiServiceClient;
import com.lms.course.client.UserClient;
import com.lms.course.entity.*;
import com.lms.course.repository.*;
import com.lms.course.repository.ModuleRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdaptiveQuizService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AdaptiveQuizService.class);

    private static final int QUESTIONS_PER_SESSION = 10;
    private static final double THRESHOLD_UP = 0.70;   // >70% correct → increase difficulty
    private static final double THRESHOLD_DOWN = 0.40; // <40% correct → decrease difficulty
    private static final double AI_RATIO = 0.40;        // 40% chance de question IA
    private static final String AI_QUIZ_TITLE = "AI-Adaptive";

    private final AdaptiveSessionRepository sessionRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final QuizRepository quizRepository;
    private final LacuneRepository lacuneRepository;
    private final ModuleRepository moduleRepository;
    private final UserClient userClient;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Random random = new Random();

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public AdaptiveSession startSession(String studentId, Long moduleId) {
        CModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found: " + moduleId));

        AdaptiveSession session = new AdaptiveSession();
        session.setStudentId(studentId);
        session.setModule(module);
        session.setTotalQuestions(QUESTIONS_PER_SESSION);
        session.setCurrentDifficulty(resolveStartingDifficulty(studentId, moduleId));

        return sessionRepository.save(session);
    }

    @Transactional
    public Question nextQuestion(Long sessionId, String studentId) {
        AdaptiveSession session = sessionRepository.findByIdAndStudentId(sessionId, studentId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() != AdaptiveSession.SessionStatus.IN_PROGRESS) {
            throw new RuntimeException("Session is not active");
        }
        if (session.getAnsweredCount() >= session.getTotalQuestions()) {
            throw new RuntimeException("Session already completed");
        }

        Set<Long> alreadyAnswered = session.getResults() == null ? new HashSet<>() :
                session.getResults().stream()
                        .map(r -> r.getQuestion().getId())
                        .collect(Collectors.toSet());

        List<String> weakCompetences = getWeakCompetences(studentId, session.getModule().getId());

        Question next = pickNextQuestion(session, alreadyAnswered, weakCompetences);
        if (next == null) {
            log.info("No more questions available for session {}, auto-completing", session.getId());
            completeSession(session, studentId);
            return null;
        }
        return next;
    }

    @Transactional
    public AdaptiveSessionResult submitAnswer(Long sessionId, String studentId,
                                              Long questionId, String selectedOptionId, String textAnswer) {
        AdaptiveSession session = sessionRepository.findByIdAndStudentId(sessionId, studentId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() != AdaptiveSession.SessionStatus.IN_PROGRESS) {
            throw new RuntimeException("Session is not active");
        }

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        boolean correct = evaluateAnswer(question, selectedOptionId, textAnswer);
        int points = correct ? (question.getPoints() != null ? question.getPoints() : 1) : 0;

        AdaptiveSessionResult result = new AdaptiveSessionResult();
        result.setSession(session);
        result.setQuestion(question);
        result.setSelectedOptionId(selectedOptionId);
        result.setTextAnswer(textAnswer);
        result.setCorrect(correct);
        result.setPointsEarned(points);

        if (session.getResults() == null) session.setResults(new ArrayList<>());
        session.getResults().add(result);
        session.setAnsweredCount(session.getAnsweredCount() + 1);
        if (correct) session.setCorrectCount(session.getCorrectCount() + 1);

        adaptDifficulty(session);

        if (session.getAnsweredCount() >= session.getTotalQuestions()) {
            completeSession(session, studentId);
        }

        sessionRepository.save(session);
        return result;
    }

    @Transactional
    public AdaptiveSession completeSessionManually(Long sessionId, String studentId) {
        AdaptiveSession session = sessionRepository.findByIdAndStudentId(sessionId, studentId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        completeSession(session, studentId);
        return sessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public List<AdaptiveSession> getStudentSessions(String studentId) {
        return sessionRepository.findByStudentIdOrderByStartedAtDesc(studentId);
    }

    @Transactional(readOnly = true)
    public List<AdaptiveSession> getStudentSessionsByModule(String studentId, Long moduleId) {
        return sessionRepository.findByStudentIdAndModuleId(studentId, moduleId);
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ────────────────────────────────────────────────────────────────────────────

    private Question.DifficultyLevel resolveStartingDifficulty(String studentId, Long moduleId) {
        List<Lacune> lacunes = lacuneRepository.findByStudentIdAndModuleId(studentId, moduleId);
        if (lacunes.isEmpty()) return Question.DifficultyLevel.EASY;
        long faiblesses = lacunes.stream().filter(l -> "FAIBLE".equals(l.getNiveau())).count();
        return faiblesses >= 2 ? Question.DifficultyLevel.EASY : Question.DifficultyLevel.MEDIUM;
    }

    private List<String> getWeakCompetences(String studentId, Long moduleId) {
        return lacuneRepository.findByStudentIdAndModuleId(studentId, moduleId)
                .stream()
                .filter(l -> "FAIBLE".equals(l.getNiveau()) || "MOYEN".equals(l.getNiveau()))
                .map(Lacune::getCompetence)
                .collect(Collectors.toList());
    }

    private Question pickNextQuestion(AdaptiveSession session, Set<Long> alreadyAnswered, List<String> weakCompetences) {
        boolean rollAi = random.nextDouble() < AI_RATIO;

        if (rollAi) {
            Question aiQ = generateAndSaveAiQuestion(session, alreadyAnswered, weakCompetences);
            if (aiQ != null) return aiQ;
            log.debug("AI question generation failed, falling back to DB for session {}", session.getId());
        }

        Question dbQ = pickFromDatabase(session, alreadyAnswered, weakCompetences);
        if (dbQ != null) return dbQ;

        if (!rollAi) {
            Question aiQ = generateAndSaveAiQuestion(session, alreadyAnswered, weakCompetences);
            if (aiQ != null) return aiQ;
        }

        return null;
    }

    private Question pickFromDatabase(AdaptiveSession session, Set<Long> alreadyAnswered, List<String> weakCompetences) {
        Long moduleId = session.getModule().getId();
        Question.DifficultyLevel difficulty = session.getCurrentDifficulty();

        // Priorité 1 : question sur une compétence faible (lacune) au niveau courant
        for (String competence : weakCompetences) {
            List<Question> candidates = questionRepository
                    .findByModuleIdAndCompetenceAndDifficulty(moduleId, competence, difficulty)
                    .stream().filter(q -> !alreadyAnswered.contains(q.getId()))
                    .collect(Collectors.toList());
            if (!candidates.isEmpty()) {
                Collections.shuffle(candidates);
                return candidates.get(0);
            }
        }

        // Priorité 2 : n'importe quelle question du niveau courant
        List<Question> byDiff = questionRepository.findByModuleIdAndDifficulty(moduleId, difficulty)
                .stream().filter(q -> !alreadyAnswered.contains(q.getId()))
                .collect(Collectors.toList());
        if (!byDiff.isEmpty()) {
            Collections.shuffle(byDiff);
            return byDiff.get(0);
        }

        // Priorité 3 : n'importe quelle question du module non encore posée
        List<Question> any = questionRepository.findByModuleId(moduleId)
                .stream().filter(q -> !alreadyAnswered.contains(q.getId()))
                .collect(Collectors.toList());
        if (!any.isEmpty()) {
            Collections.shuffle(any);
            return any.get(0);
        }

        return null;
    }

    private Question generateAndSaveAiQuestion(AdaptiveSession session,
                                                Set<Long> alreadyAnswered,
                                                List<String> weakCompetences) {
        Question q = null;
        try {
            Long moduleId = session.getModule().getId();

            // Textes déjà posés pour éviter les répétitions
            List<String> previousTexts = session.getResults() != null
                    ? session.getResults().stream()
                        .map(r -> r.getQuestion().getText())
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList())
                    : Collections.emptyList();

            // Score courant de la session
            double sessionScore = session.getAnsweredCount() > 0
                    ? (double) session.getCorrectCount() / session.getAnsweredCount() * 100
                    : 50.0;

            // Compétence prioritaire : première lacune si disponible
            String targetCompetence = weakCompetences.isEmpty() ? null : weakCompetences.get(0);

            AiServiceClient.GenerateQuestionRequest req = new AiServiceClient.GenerateQuestionRequest();
            req.setModuleId(moduleId);
            req.setDifficulty(session.getCurrentDifficulty().name());
            req.setCompetence(targetCompetence);
            req.setLacunes(weakCompetences);
            req.setPreviousQuestions(previousTexts);
            req.setSessionScorePercent(sessionScore);

            String jsonResponse = aiServiceClient.generateAdaptiveQuestion(req);
            if (jsonResponse == null || jsonResponse.isBlank()) return null;

            // Nettoyer la réponse JSON
            jsonResponse = jsonResponse.trim();
            int start = jsonResponse.indexOf("{");
            int end = jsonResponse.lastIndexOf("}");
            if (start < 0 || end <= start) return null;
            jsonResponse = jsonResponse.substring(start, end + 1);

            JsonNode root = objectMapper.readTree(jsonResponse);

            // Construire la Question
            q = new Question();
            String qText = root.has("text") ? root.get("text").asText() : null;
            if (qText == null || qText.isBlank()) return null;
            q.setText(qText);

            q.setCompetence(root.has("competence") ? root.get("competence").asText() : targetCompetence);
            String justif = root.has("justification") ? root.get("justification").asText() : null;
            q.setJustification(justif);
            q.setDifficultyLevel(session.getCurrentDifficulty());
            q.setType(Question.QuestionType.SINGLE_CHOICE);
            q.setPoints(1);
            q.setAiGenerated(true);

            // Associer au quiz AI du module (créé si absent)
            q.setQuiz(getOrCreateAiQuiz(moduleId));
            Question saved = questionRepository.save(q);

            // Sauvegarder les options
            JsonNode optNodes = root.get("options");
            if (optNodes == null || !optNodes.isArray() || optNodes.size() == 0) {
                questionRepository.delete(saved);
                return null;
            }

            List<QuestionOption> opts = new ArrayList<>();
            for (JsonNode optNode : optNodes) {
                QuestionOption opt = new QuestionOption();
                opt.setText(optNode.has("text") ? optNode.get("text").asText() : "");
                opt.setCorrect(optNode.has("correct") && optNode.get("correct").asBoolean());
                opt.setQuestion(saved);
                opts.add(opt);
            }
            questionOptionRepository.saveAll(opts);
            saved.setOptions(opts);

            log.info("✅ AI question generated for module={} difficulty={} competence={}",
                    moduleId, session.getCurrentDifficulty(), q.getCompetence());
            return saved;

        } catch (Exception e) {
            log.warn("⚠️ AI question generation failed for session {}: {}", session.getId(), e.getMessage());
            if (q != null) safeDetach(q);
            return null;
        }
    }

    private void safeDetach(Object entity) {
        try { entityManager.detach(entity); } catch (Exception ignored) {}
    }

    private Quiz getOrCreateAiQuiz(Long moduleId) {
        return quizRepository.findByTitleAndModuleId(AI_QUIZ_TITLE, moduleId)
                .orElseGet(() -> {
                    CModule module = moduleRepository.findById(moduleId)
                            .orElseThrow(() -> new RuntimeException("Module not found: " + moduleId));
                    Quiz quiz = new Quiz();
                    quiz.setTitle(AI_QUIZ_TITLE);
                    quiz.setDescription("Questions générées par l'IA pour le parcours adaptatif");
                    quiz.setModule(module);
                    quiz.setIsDraft(false);
                    log.info("Created AI-Adaptive quiz for module {}", moduleId);
                    return quizRepository.save(quiz);
                });
    }

    private boolean evaluateAnswer(Question question, String selectedOptionId, String textAnswer) {
        if (question.getOptions() == null || question.getOptions().isEmpty()) return false;
        if (selectedOptionId == null) return false;

        return question.getOptions().stream()
                .filter(opt -> opt.getId().toString().equals(selectedOptionId))
                .anyMatch(QuestionOption::isCorrect);
    }

    private void adaptDifficulty(AdaptiveSession session) {
        if (session.getAnsweredCount() < 3) return; // attendre au moins 3 réponses

        double ratio = (double) session.getCorrectCount() / session.getAnsweredCount();

        if (ratio > THRESHOLD_UP && session.getCurrentDifficulty() != Question.DifficultyLevel.HARD) {
            Question.DifficultyLevel next = session.getCurrentDifficulty() == Question.DifficultyLevel.EASY
                    ? Question.DifficultyLevel.MEDIUM : Question.DifficultyLevel.HARD;
            session.setCurrentDifficulty(next);
            log.info("Student {} difficulty increased to {}", session.getStudentId(), next);
        } else if (ratio < THRESHOLD_DOWN && session.getCurrentDifficulty() != Question.DifficultyLevel.EASY) {
            Question.DifficultyLevel prev = session.getCurrentDifficulty() == Question.DifficultyLevel.HARD
                    ? Question.DifficultyLevel.MEDIUM : Question.DifficultyLevel.EASY;
            session.setCurrentDifficulty(prev);
            log.info("Student {} difficulty decreased to {}", session.getStudentId(), prev);
        }
    }

    private void completeSession(AdaptiveSession session, String studentId) {
        session.setStatus(AdaptiveSession.SessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());

        double score = session.getAnsweredCount() > 0
                ? (double) session.getCorrectCount() / session.getAnsweredCount() * 100
                : 0.0;
        session.setScorePercent(score);

        updateLacunes(session, studentId);
        syncAdaptiveProfile(session, studentId, score);
        generateAiRecommendations(session, studentId, score);
        log.info("Session {} completed for student {} — score: {}%", session.getId(), studentId, score);
    }

    private void generateAiRecommendations(AdaptiveSession session, String studentId, double score) {
        try {
            Long moduleId = session.getModule().getId();

            // Lacunes après la session
            List<String> lacunes = lacuneRepository.findByStudentIdAndModuleId(studentId, moduleId)
                    .stream()
                    .filter(l -> "FAIBLE".equals(l.getNiveau()) || "MOYEN".equals(l.getNiveau()))
                    .map(Lacune::getCompetence)
                    .collect(Collectors.toList());

            // Points forts : compétences bien maîtrisées dans cette session
            List<String> strongCompetences = new ArrayList<>();
            if (session.getResults() != null) {
                Map<String, long[]> stats = new HashMap<>();
                for (AdaptiveSessionResult r : session.getResults()) {
                    String comp = r.getQuestion().getCompetence();
                    if (comp == null) continue;
                    stats.computeIfAbsent(comp, k -> new long[]{0, 0});
                    stats.get(comp)[0]++;
                    if (Boolean.TRUE.equals(r.getCorrect())) stats.get(comp)[1]++;
                }
                stats.forEach((comp, arr) -> {
                    if (arr[0] > 0 && (double) arr[1] / arr[0] >= 0.75) strongCompetences.add(comp);
                });
            }

            AiServiceClient.SessionRecommendationRequest req = new AiServiceClient.SessionRecommendationRequest();
            req.setModuleId(moduleId);
            req.setScorePercent(score);
            req.setAnsweredCount(session.getAnsweredCount());
            req.setCorrectCount(session.getCorrectCount());
            req.setLacunes(lacunes);
            req.setStrongCompetences(strongCompetences);

            String recommendations = aiServiceClient.getSessionRecommendations(req);
            if (recommendations != null && !recommendations.isBlank()) {
                session.setAiRecommendations(recommendations);
                log.info("✅ AI recommendations generated for session {}", session.getId());
            }
        } catch (Exception e) {
            log.warn("⚠️ AI recommendations failed for session {}: {}", session.getId(), e.getMessage());
        }
    }

    private void syncAdaptiveProfile(AdaptiveSession session, String studentId, double score) {
        if (session.getResults() == null) return;
        try {
            Map<String, Double> competenceScores = new HashMap<>();
            Map<String, long[]> stats = new HashMap<>();
            for (AdaptiveSessionResult r : session.getResults()) {
                String comp = r.getQuestion().getCompetence();
                if (comp == null) continue;
                stats.computeIfAbsent(comp, k -> new long[]{0, 0});
                stats.get(comp)[0]++;
                if (Boolean.TRUE.equals(r.getCorrect())) stats.get(comp)[1]++;
            }
            stats.forEach((comp, arr) -> competenceScores.put(comp, arr[0] > 0 ? (double) arr[1] / arr[0] : 0.0));
            userClient.updateAdaptiveProfileFromSession(studentId, new UserClient.SessionResultPayload(competenceScores, score));
        } catch (Exception e) {
            log.warn("Failed to sync adaptive profile for {}: {}", studentId, e.getMessage());
        }
    }

    private void updateLacunes(AdaptiveSession session, String studentId) {
        if (session.getResults() == null) return;

        Map<String, long[]> competenceStats = new HashMap<>();
        for (AdaptiveSessionResult r : session.getResults()) {
            String comp = r.getQuestion().getCompetence();
            if (comp == null) continue;
            competenceStats.computeIfAbsent(comp, k -> new long[]{0, 0});
            competenceStats.get(comp)[0]++;
            if (Boolean.TRUE.equals(r.getCorrect())) competenceStats.get(comp)[1]++;
        }

        Long moduleId = session.getModule().getId();
        
        // Traiter chaque compétence individuellement
        for (Map.Entry<String, long[]> entry : competenceStats.entrySet()) {
            String comp = entry.getKey();
            long total = entry.getValue()[0];
            long correct = entry.getValue()[1];
            double ratio = total > 0 ? (double) correct / total : 0;

            String niveau = ratio >= 0.75 ? null : ratio >= 0.50 ? "MOYEN" : "FAIBLE";

            // Supprimer uniquement la lacune de cette compétence spécifique
            lacuneRepository.findByStudentIdAndModuleIdAndCompetence(studentId, moduleId, comp)
                    .ifPresent(lacuneRepository::delete);

            // Créer une nouvelle lacune si le niveau est insuffisant
            if (niveau != null) {
                Lacune lacune = new Lacune();
                lacune.setStudentId(studentId);
                lacune.setModuleId(moduleId);
                lacune.setCompetence(comp);
                lacune.setNiveau(niveau);
                lacuneRepository.save(lacune);
                log.info("Lacune enregistrée: {} - {} - {}", studentId, comp, niveau);
            } else {
                // SLF4J n'a que le placeholder "{}" (pas de spécificateur de
                // format type printf) — "{:.2f}" n'était pas reconnu et
                // s'affichait littéralement, le ratio disparaissant du log.
                log.info("Lacune résolue: {} - {} (ratio: {})", studentId, comp, String.format("%.2f", ratio));
            }
        }
    }
}
