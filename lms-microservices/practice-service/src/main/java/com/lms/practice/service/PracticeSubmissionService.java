package com.lms.practice.service;

import com.lms.practice.client.PistonClient;
import com.lms.practice.config.PistonProperties;
import com.lms.practice.dto.*;
import com.lms.practice.entity.*;
import com.lms.practice.exception.NotFoundException;
import com.lms.practice.repository.CodeSubmissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PracticeSubmissionService {

    private static final Logger log = LoggerFactory.getLogger(PracticeSubmissionService.class);

    // Token delimiters — injected verbatim into every language harness
    static final String LMS_START = "---LMS_RESULT_START---";
    static final String LMS_END   = "---LMS_RESULT_END---";

    private final PracticeService practiceService;
    private final CodeSubmissionRepository submissionRepository;
    private final PistonClient pistonClient;
    private final PistonProperties pistonProperties;
    private final RestTemplate restTemplate;

    public PracticeSubmissionService(PracticeService practiceService,
                                     CodeSubmissionRepository submissionRepository,
                                     PistonClient pistonClient,
                                     PistonProperties pistonProperties,
                                     RestTemplate practiceRestTemplate) {
        this.practiceService    = practiceService;
        this.submissionRepository = submissionRepository;
        this.pistonClient       = pistonClient;
        this.pistonProperties   = pistonProperties;
        this.restTemplate       = practiceRestTemplate;
    }

    // ── Public API ───────────────────────────────────────────────────────────────

    /**
     * Enregistre la soumission en PENDING immédiatement (< 50ms) et lance
     * l'évaluation en arrière-plan. Le client doit poller GET /submissions/{id}/status.
     */
    @Transactional
    public SubmissionResultDto submit(Long exerciseId, CodeSubmitRequestDto request, String studentId) {
        CodingExercise exercise = practiceService.findPublishedOrThrow(exerciseId);
        validateLanguage(exercise, request.getLanguage());

        // Sauvegarde immédiate en PENDING
        CodeSubmission pending = new CodeSubmission();
        pending.setExercise(exercise);
        pending.setStudentId(studentId);
        pending.setSourceCode(request.getSourceCode());
        pending.setLanguage(request.getLanguage());
        pending.setStatus(SubmissionStatus.PENDING);
        pending.setScorePercent(0);
        CodeSubmission saved = submissionRepository.save(pending);

        // Lance l'évaluation en arrière-plan
        evaluateAsync(saved.getId(), exerciseId, request, studentId);

        // Retourne immédiatement avec PENDING
        SubmissionResultDto response = new SubmissionResultDto();
        response.setSubmissionId(saved.getId());
        response.setStatus(SubmissionStatus.PENDING);
        response.setLanguage(request.getLanguage());
        response.setSubmittedAt(saved.getSubmittedAt());
        response.setPersisted(true);
        response.setMessage("Evaluation en cours — poll GET /api/practice/submissions/" + saved.getId() + "/status");
        return response;
    }

    /**
     * Évaluation réelle, lancée en background par submit().
     * Chaque appel tourne dans le thread pool 'submissionExecutor'.
     */
    @Async("submissionExecutor")
    public void evaluateAsync(Long submissionId, Long exerciseId, CodeSubmitRequestDto request, String studentId) {
        try {
            CodingExercise exercise = practiceService.findExerciseOrThrow(exerciseId);
            SubmissionResultDto result = evaluate(exercise, request, studentId, false, false);

            // Met à jour la soumission PENDING avec le vrai résultat
            CodeSubmission submission = submissionRepository.findById(submissionId)
                    .orElseThrow(() -> new NotFoundException("Submission not found: " + submissionId));
            submission.setStatus(result.getStatus());
            submission.setScorePercent(result.getScorePercent());

            // Persist test case results
            List<TestCase> cases = exercise.getTestCases().stream()
                    .sorted((a, b) -> Integer.compare(a.getOrderIndex(), b.getOrderIndex()))
                    .collect(Collectors.toList());
            List<TestCaseResultDto> resultDtos = result.getResults();
            long totalExecutionTime = 0;
            for (int i = 0; i < Math.min(cases.size(), resultDtos.size()); i++) {
                TestCase tc = cases.get(i);
                TestCaseResultDto rdto = resultDtos.get(i);
                TestCaseResult entity = new TestCaseResult();
                entity.setSubmission(submission);
                entity.setTestCaseId(tc.getId());
                entity.setCaseIndex(rdto.getIndex());
                entity.setPassed(rdto.isPassed());
                entity.setStdout(rdto.getStdout());
                entity.setLogs(rdto.getLogs());
                entity.setStderr(rdto.getStderr());
                entity.setExecutionTimeMs(rdto.getExecutionTimeMs());
                if (rdto.getExecutionTimeMs() != null) {
                    totalExecutionTime += rdto.getExecutionTimeMs();
                }
                entity.setHidden(tc.isHidden());
                submission.getCaseResults().add(entity);
            }
            submission.setExecutionTimeMs(totalExecutionTime);
            submissionRepository.save(submission);

            // XP si premier ACCEPTED 100%
            boolean firstAccept = result.getStatus() == SubmissionStatus.ACCEPTED
                    && result.getScorePercent() == 100
                    && !submissionRepository.existsByExercise_IdAndStudentIdAndStatusAndScorePercent(
                            exerciseId, studentId, SubmissionStatus.ACCEPTED, 100);
            if (firstAccept) {
                awardXp(exercise, studentId);
            }

        } catch (Exception e) {
            log.error("[evaluateAsync] Erreur pour submission {}: {}", submissionId, e.getMessage(), e);
            // Marque la soumission en INTERNAL_ERROR
            submissionRepository.findById(submissionId).ifPresent(s -> {
                s.setStatus(SubmissionStatus.INTERNAL_ERROR);
                submissionRepository.save(s);
            });
        }
    }

    /** Exécute seulement les cas publics, ne persiste pas — pour le bouton "Run" */
    @Transactional(readOnly = true)
    public SubmissionResultDto run(Long exerciseId, CodeSubmitRequestDto request, String studentId) {
        CodingExercise exercise = practiceService.findPublishedOrThrow(exerciseId);
        validateLanguage(exercise, request.getLanguage());
        return evaluate(exercise, request, studentId, true, false);
    }

    /**
     * Polling endpoint — retourne le statut courant de la soumission.
     * Accessible tant que status == PENDING ; une fois terminé retourne le résultat complet.
     */
    public SubmissionResultDto getSubmissionStatus(Long submissionId, String studentId) {
        CodeSubmission submission = submissionRepository.findByIdAndStudentId(submissionId, studentId)
                .orElseThrow(() -> new NotFoundException("Submission not found: " + submissionId));

        SubmissionResultDto dto = new SubmissionResultDto();
        dto.setSubmissionId(submission.getId());
        dto.setStatus(submission.getStatus());
        dto.setScorePercent(submission.getScorePercent());
        dto.setLanguage(submission.getLanguage());
        dto.setSubmittedAt(submission.getSubmittedAt());
        dto.setPersisted(true);

        if (submission.getStatus() == SubmissionStatus.PENDING) {
            dto.setMessage("Evaluation en cours...");
            return dto;
        }

        List<TestCaseResultDto> results = submission.getCaseResults().stream()
                .map(this::toResultDto)
                .collect(Collectors.toList());
        dto.setResults(results);

        long passed = results.stream().filter(TestCaseResultDto::isPassed).count();
        dto.setPassedCount((int) passed);
        dto.setTotalCount(results.size());
        dto.setMessage(buildMessage(submission.getStatus(), (int) passed, results.size()));

        results.stream()
                .map(TestCaseResultDto::getExecutionTimeMs)
                .filter(t -> t != null)
                .mapToLong(Long::longValue)
                .max()
                .ifPresent(dto::setExecutionTimeMsMax);

        return dto;
    }

    public SubmissionResultDto runPlayground(CodeSubmitRequestDto request) {
        String language = request.getLanguage();
        if (language == null || language.isBlank()) {
            throw new IllegalArgumentException("Language is required");
        }
        PistonClient.JudgeResult jr = pistonClient.execute(
                request.getSourceCode(), language, "");

        TestCaseResultDto rdto = new TestCaseResultDto();
        rdto.setIndex(0);
        rdto.setPassed(jr.isAccepted());
        rdto.setHidden(false);
        rdto.setExecutionTimeMs(jr.getTimeMs());
        rdto.setStdout(jr.getStdout());
        rdto.setStderr(firstNonBlank(jr.getStderr(), jr.getCompileOutput()));

        SubmissionResultDto response = new SubmissionResultDto();
        response.setStatus(jr.getStatus());
        response.setScorePercent(jr.isAccepted() ? 100 : 0);
        response.setResults(List.of(rdto));
        response.setPersisted(false);
        return response;
    }

    public List<SubmissionHistoryDto> getHistory(Long exerciseId, String studentId) {
        return submissionRepository
                .findTop10ByExercise_IdAndStudentIdOrderBySubmittedAtDesc(exerciseId, studentId)
                .stream()
                .map(s -> {
                    SubmissionHistoryDto dto = new SubmissionHistoryDto();
                    dto.setId(s.getId());
                    dto.setStatus(s.getStatus());
                    dto.setScorePercent(s.getScorePercent());
                    dto.setLanguage(s.getLanguage());
                    dto.setSubmittedAt(s.getSubmittedAt());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public SubmissionResultDto getSubmissionDetail(Long submissionId, String studentId) {
        CodeSubmission submission = submissionRepository.findByIdAndStudentId(submissionId, studentId)
                .orElseThrow(() -> new NotFoundException("Submission not found: " + submissionId));

        List<TestCaseResultDto> results = submission.getCaseResults().stream()
                .map(this::toResultDto)
                .collect(Collectors.toList());

        long passed = results.stream().filter(TestCaseResultDto::isPassed).count();

        SubmissionResultDto dto = new SubmissionResultDto();
        dto.setSubmissionId(submission.getId());
        dto.setStatus(submission.getStatus());
        dto.setScorePercent(submission.getScorePercent());
        dto.setLanguage(submission.getLanguage());
        dto.setPassedCount((int) passed);
        dto.setTotalCount(results.size());
        dto.setMessage(buildMessage(submission.getStatus(), (int) passed, results.size()));
        dto.setSubmittedAt(submission.getSubmittedAt());
        dto.setPersisted(true);
        dto.setResults(results);
        results.stream()
                .map(TestCaseResultDto::getExecutionTimeMs)
                .filter(t -> t != null)
                .mapToLong(Long::longValue)
                .max()
                .ifPresent(dto::setExecutionTimeMsMax);
        return dto;
    }

    public List<LeaderboardEntryDto> getLeaderboard(Long exerciseId, int limit) {
        practiceService.findExerciseOrThrow(exerciseId);
        Map<String, CodeSubmission> bestByStudent = new LinkedHashMap<>();
        for (CodeSubmission s : submissionRepository.findAcceptedLeaderboard(exerciseId)) {
            bestByStudent.putIfAbsent(s.getStudentId(), s);
        }
        List<LeaderboardEntryDto> board = new ArrayList<>();
        int rank = 1;
        for (CodeSubmission s : bestByStudent.values()) {
            if (rank > limit) break;
            LeaderboardEntryDto entry = new LeaderboardEntryDto();
            entry.setRank(rank++);
            entry.setStudentId(s.getStudentId());
            entry.setScorePercent(s.getScorePercent());
            entry.setExecutionTimeMs(s.getExecutionTimeMs());
            entry.setSubmittedAt(s.getSubmittedAt());
            board.add(entry);
        }
        return board;
    }

    // ── Core evaluation ──────────────────────────────────────────────────────────

    private SubmissionResultDto evaluate(CodingExercise exercise, CodeSubmitRequestDto request,
                                          String studentId, boolean publicOnly, boolean persist) {
        String lang = request.getLanguage().toLowerCase();

        List<TestCase> cases = exercise.getTestCases().stream()
                .filter(tc -> !publicOnly || !tc.isHidden())
                .sorted((a, b) -> Integer.compare(a.getOrderIndex(), b.getOrderIndex()))
                .collect(Collectors.toList());

        if (cases.isEmpty() && publicOnly) {
            cases = exercise.getTestCases().stream()
                    .sorted((a, b) -> Integer.compare(a.getOrderIndex(), b.getOrderIndex()))
                    .collect(Collectors.toList());
        }

        if (cases.isEmpty()) {
            throw new IllegalStateException("No test cases available for execution");
        }

        int totalWeight = cases.stream().mapToInt(TestCase::getWeightPercent).sum();
        if (totalWeight <= 0) totalWeight = cases.size() * 100;

        int earnedWeight = 0;
        List<TestCaseResultDto> resultDtos = new ArrayList<>();
        SubmissionStatus overallStatus = SubmissionStatus.ACCEPTED;
        int index = 0;

        // Resolve wrapper: language-specific first, then default
        String wrapper = null;
        if (exercise.getLanguageWrappers() != null) {
            wrapper = exercise.getLanguageWrappers().get(lang);
        }
        if (wrapper == null || wrapper.isBlank()) {
            wrapper = exercise.getWrapperCode();
        }

        String finalCode = buildFinalCode(request.getSourceCode(), wrapper, lang);

        for (TestCase tc : cases) {
            String sanitizedInput    = tc.getInput()          != null ? tc.getInput().replace("\\n", "\n")          : "";
            String sanitizedExpected = tc.getExpectedOutput() != null ? tc.getExpectedOutput().replace("\\n", "\n") : "";

            PistonClient.JudgeResult jr = pistonClient.execute(finalCode, lang, sanitizedInput);

            String extractedResult = extractResultFromStdout(jr.getStdout());
            boolean passed = jr.isAccepted() && outputsMatch(extractedResult, tc.getExpectedOutput());

            if (passed) {
                earnedWeight += tc.getWeightPercent();
            } else if (overallStatus == SubmissionStatus.ACCEPTED) {
                overallStatus = mapFailureStatus(jr.getStatus());
            }

            TestCaseResultDto rdto = new TestCaseResultDto();
            rdto.setIndex(index++);
            rdto.setPassed(passed);
            rdto.setHidden(tc.isHidden());
            rdto.setExecutionTimeMs(jr.getTimeMs());
            if (!tc.isHidden()) {
                rdto.setInput(tc.getInput());
                rdto.setExpectedOutput(tc.getExpectedOutput());
                String extractedStdout = extractResultFromStdout(jr.getStdout());
                rdto.setStdout(extractedStdout != null ? extractedStdout.trim() : null);
                rdto.setLogs(extractLogsFromStdout(jr.getStdout()));
                rdto.setStderr(firstNonBlank(jr.getStderr(), jr.getCompileOutput()));
            } else if (!passed) {
                rdto.setStderr("Hidden test case failed");
            }
            resultDtos.add(rdto);
        }

        int scorePercent = (int) Math.round((earnedWeight * 100.0) / totalWeight);
        if (scorePercent < 100 && overallStatus == SubmissionStatus.ACCEPTED) {
            overallStatus = SubmissionStatus.WRONG_ANSWER;
        }
        if (scorePercent == 100) {
            overallStatus = SubmissionStatus.ACCEPTED;
        }

        long passed = resultDtos.stream().filter(TestCaseResultDto::isPassed).count();
        long maxTime = resultDtos.stream()
                .map(TestCaseResultDto::getExecutionTimeMs)
                .filter(t -> t != null)
                .mapToLong(Long::longValue)
                .max().orElse(0L);

        SubmissionResultDto response = new SubmissionResultDto();
        response.setStatus(overallStatus);
        response.setScorePercent(scorePercent);
        response.setPassedCount((int) passed);
        response.setTotalCount(resultDtos.size());
        response.setLanguage(request.getLanguage());
        response.setExecutionTimeMsMax(maxTime);
        response.setMessage(buildMessage(overallStatus, (int) passed, resultDtos.size()));
        response.setResults(resultDtos);
        response.setPersisted(false);

        return response;
    }

    // ── Language-aware code builder ──────────────────────────────────────────────

    private String buildFinalCode(String userCode, String wrapperCode, String language) {
        if (wrapperCode == null || wrapperCode.isBlank()) {
            return userCode;
        }
        return switch (language) {
            case "python"     -> mergeForPython(userCode, wrapperCode);
            case "javascript" -> mergeForJavaScript(userCode, wrapperCode);
            case "typescript" -> mergeForJavaScript(userCode, wrapperCode);
            case "php"        -> mergeForPhp(userCode, wrapperCode);
            case "dart"       -> mergeForDart(userCode, wrapperCode);
            case "cpp"        -> mergeForCpp(userCode, wrapperCode);
            case "csharp"     -> mergeForCsharp(userCode, wrapperCode);
            case "go"         -> mergeForGo(userCode, wrapperCode);
            default           -> mergeForJava(userCode, wrapperCode);
        };
    }

    private String mergeForJava(String userCode, String wrapperCode) {
        Set<String> imports = new LinkedHashSet<>();
        StringBuilder userCodeClean    = new StringBuilder();
        StringBuilder wrapperCodeClean = new StringBuilder();

        if (userCode != null) {
            userCode = userCode.replaceFirst(
                    "(?m)^(\\s*)(public\\s+)?class\\s+Solution\\b",
                    "$1class Solution extends BaseSolution");
            for (String line : userCode.split("\\r?\\n")) {
                if (line.trim().startsWith("import ") && line.trim().endsWith(";")) {
                    imports.add(line.trim());
                } else {
                    userCodeClean.append(line).append("\n");
                }
            }
        }

        for (String line : wrapperCode.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("import ") && trimmed.endsWith(";")) {
                imports.add(trimmed);
            } else {
                String rewritten = wrapJavaSystemOutPrintln(line);
                wrapperCodeClean.append(rewritten).append("\n");
            }
        }

        StringBuilder merged = new StringBuilder();
        imports.forEach(imp -> merged.append(imp).append("\n"));
        merged.append("\n");

        merged.append("class BaseSolution {\n");
        merged.append("    protected void print(Object... args) {\n");
        merged.append("        System.out.println(\"" + LMS_START + "\");\n");
        merged.append("        if (args == null) { System.out.println(\"null\"); } else {\n");
        merged.append("            for (int i = 0; i < args.length; i++) {\n");
        merged.append("                System.out.print(args[i]);\n");
        merged.append("                if (i < args.length - 1) System.out.print(\" \");\n");
        merged.append("            }\n");
        merged.append("            System.out.println();\n");
        merged.append("        }\n");
        merged.append("        System.out.println(\"" + LMS_END + "\");\n");
        merged.append("    }\n");
        merged.append("}\n\n");

        merged.append(userCodeClean).append("\n");
        merged.append(wrapperCodeClean);
        return merged.toString();
    }

    /**
     * Wrap System.out.println calls with result delimiters.
     * Handles nested parentheses by counting bracket depth.
     */
    private String wrapJavaSystemOutPrintln(String line) {
        if (!line.contains("System.out.println")) {
            return line;
        }
        
        int idx = line.indexOf("System.out.println(");
        if (idx == -1) {
            return line;
        }
        
        // Extract the part before System.out.println
        String before = line.substring(0, idx);
        String after = line.substring(idx + "System.out.println(".length());
        
        // Find matching closing parenthesis
        int parenDepth = 1;
        int endIdx = 0;
        for (int i = 0; i < after.length(); i++) {
            char c = after.charAt(i);
            if (c == '(') parenDepth++;
            else if (c == ')') {
                parenDepth--;
                if (parenDepth == 0) {
                    endIdx = i;
                    break;
                }
            }
        }
        
        if (endIdx == 0) {
            return line; // Could not parse, return unchanged
        }
        
        String argument = after.substring(0, endIdx);
        String trailing = after.substring(endIdx + 1);
        
        return before + "Object _lms_res = " + argument + "; System.out.println(\"" + LMS_START + "\"); System.out.println(_lms_res); System.out.println(\"" + LMS_END + "\");" + trailing;
    }

    private String mergeForPython(String userCode, String wrapperCode) {
        String patchedWrapper = wrapperCode.replaceAll(
                "(?m)^([ \\t]*)print\\(([^)]+)\\)[ \\t]*$",
                "$1_lms_res = $2\n$1print(\"" + LMS_START + "\")\n$1print(_lms_res)\n$1print(\"" + LMS_END + "\")"
        );
        return (userCode != null ? userCode : "") + "\n\n" + patchedWrapper;
    }

    private String mergeForJavaScript(String userCode, String wrapperCode) {
        String patchedWrapper = wrapperCode.replaceAll(
                "console\\.log\\(([^)]+)\\)\\s*;",
                "const _lms_res = $1; console.log(\"" + LMS_START + "\"); console.log(_lms_res); console.log(\"" + LMS_END + "\");"
        );
        return (userCode != null ? userCode : "") + "\n\n" + patchedWrapper;
    }

    private String mergeForPhp(String userCode, String wrapperCode) {
        String studentClean = (userCode != null)
                ? userCode.replaceFirst("^\\s*<\\?php\\s*", "") : "";

        String patchedWrapper = wrapperCode.replaceAll(
                "echo\\s+\\$result\\s*\\.\\s*\"\\\\n\"\\s*;",
                "echo \"" + LMS_START + "\\n\"; echo $result . \"\\n\"; echo \"" + LMS_END + "\\n\";"
        );
        patchedWrapper = patchedWrapper.replaceAll(
                "echo\\s+(\\$[\\w]+)\\s*;",
                "echo \"" + LMS_START + "\\n\"; echo $1; echo \"\\n" + LMS_END + "\\n\";"
        );

        if (patchedWrapper.contains("<?php")) {
            int insertAt = patchedWrapper.indexOf("<?php") + 5;
            return patchedWrapper.substring(0, insertAt) + "\n" + studentClean + "\n"
                    + patchedWrapper.substring(insertAt);
        }
        return "<?php\n" + studentClean + "\n" + patchedWrapper;
    }

    private String mergeForDart(String userCode, String wrapperCode) {
        String patchedWrapper = wrapperCode.replaceAll(
                "print\\(([^)]+)\\)\\s*;",
                "var _lms_res = $1; print(\"" + LMS_START + "\"); print(_lms_res); print(\"" + LMS_END + "\");"
        );

        Set<String> imports = new LinkedHashSet<>();
        StringBuilder userClean    = new StringBuilder();
        StringBuilder wrapperClean = new StringBuilder();

        if (userCode != null) {
            for (String line : userCode.split("\\r?\\n")) {
                if (line.trim().startsWith("import ")) imports.add(line.trim());
                else userClean.append(line).append("\n");
            }
        }
        for (String line : patchedWrapper.split("\\r?\\n")) {
            if (line.trim().startsWith("import ")) imports.add(line.trim());
            else wrapperClean.append(line).append("\n");
        }

        StringBuilder merged = new StringBuilder();
        imports.forEach(imp -> merged.append(imp).append("\n"));
        merged.append("\n").append(userClean).append("\n").append(wrapperClean);
        return merged.toString();
    }

    // ── C++ merge ────────────────────────────────────────────────────────────────
    private String mergeForCpp(String userCode, String wrapperCode) {
        // Wrap cout calls in wrapper with LMS delimiters
        String patchedWrapper = wrapperCode
                .replaceAll(
                        "cout\\s*<<\\s*((?:fixed\\s*<<\\s*setprecision\\([^)]+\\)\\s*<<\\s*)?[^;]+?)\\s*<<\\s*endl\\s*;",
                        "cout << \"" + LMS_START + "\" << endl; cout << $1 << endl; cout << \"" + LMS_END + "\" << endl;"
                )
                .replaceAll(
                        "cout\\s*<<\\s*((?:fixed\\s*<<\\s*setprecision\\([^)]+\\)\\s*<<\\s*)?[^;]+?)\\s*<<\\s*\"\\\\n\"\\s*;",
                        "cout << \"" + LMS_START + "\\n\"; cout << $1 << \"\\n\"; cout << \"" + LMS_END + "\\n\";"
                );

        // If wrapper has a placeholder marker, inject user code there
        if (patchedWrapper.contains("// SOLUTION_PLACEHOLDER")) {
            return patchedWrapper.replace("// SOLUTION_PLACEHOLDER", (userCode != null ? userCode : ""));
        }
        // Otherwise: extract #includes from both sides and concatenate
        Set<String> includes = new LinkedHashSet<>();
        StringBuilder userClean    = new StringBuilder();
        StringBuilder wrapperClean = new StringBuilder();
        if (userCode != null) {
            for (String line : userCode.split("\\r?\\n")) {
                if (line.trim().startsWith("#include")) includes.add(line.trim());
                else userClean.append(line).append("\n");
            }
        }
        for (String line : patchedWrapper.split("\\r?\\n")) {
            if (line.trim().startsWith("#include")) includes.add(line.trim());
            else wrapperClean.append(line).append("\n");
        }
        StringBuilder merged = new StringBuilder();
        includes.forEach(inc -> merged.append(inc).append("\n"));
        merged.append("\nusing namespace std;\n\n");
        merged.append(userClean).append("\n").append(wrapperClean);
        return merged.toString();
    }

    // ── C# merge ─────────────────────────────────────────────────────────────────
    private String mergeForCsharp(String userCode, String wrapperCode) {
        // Wrap Console.WriteLine calls in wrapper with LMS delimiters
        String patchedWrapper = wrapperCode.replaceAll(
                "Console\\.WriteLine\\(([^;]+)\\)\\s*;",
                "Console.WriteLine(\"" + LMS_START + "\"); Console.WriteLine($1); Console.WriteLine(\"" + LMS_END + "\");"
        );

        if (patchedWrapper.contains("// SOLUTION_PLACEHOLDER")) {
            return patchedWrapper.replace("// SOLUTION_PLACEHOLDER", (userCode != null ? userCode : ""));
        }
        // Hoist using statements
        Set<String> usings = new LinkedHashSet<>();
        StringBuilder userClean    = new StringBuilder();
        StringBuilder wrapperClean = new StringBuilder();
        if (userCode != null) {
            for (String line : userCode.split("\\r?\\n")) {
                if (line.trim().startsWith("using ") && line.trim().endsWith(";")) usings.add(line.trim());
                else userClean.append(line).append("\n");
            }
        }
        for (String line : patchedWrapper.split("\\r?\\n")) {
            if (line.trim().startsWith("using ") && line.trim().endsWith(";")) usings.add(line.trim());
            else wrapperClean.append(line).append("\n");
        }
        StringBuilder merged = new StringBuilder();
        usings.forEach(u -> merged.append(u).append("\n"));
        merged.append("\n").append(userClean).append("\n").append(wrapperClean);
        return merged.toString();
    }

    // ── Go merge ─────────────────────────────────────────────────────────────────
    private String mergeForGo(String userCode, String wrapperCode) {
        // Use placeholder substitution — wrapper already has // USER_CODE_HERE
        if (wrapperCode.contains("// USER_CODE_HERE")) {
            // Wrap fmt.Printf with LMS delimiters in wrapper
            String patched = wrapperCode
                    .replaceAll("fmt\\.Printf\\(([^)]+)\\)",
                            "fmt.Println(\"" + LMS_START + "\"); fmt.Printf($1); fmt.Println(\"" + LMS_END + "\")")
                    .replaceAll("fmt\\.Println\\(([^\"]+)\\)",
                            "fmt.Println(\"" + LMS_START + "\"); fmt.Println($1); fmt.Println(\"" + LMS_END + "\")");
            return patched.replace("// USER_CODE_HERE", (userCode != null ? userCode : ""));
        }
        // Fallback: user code (functions) before wrapper (main)
        return (userCode != null ? userCode : "") + "\n\n" + wrapperCode;
    }

    // ── stdout helpers ───────────────────────────────────────────────────────────

    private String extractResultFromStdout(String stdout) {
        if (stdout == null) return null;
        int startIdx = stdout.indexOf(LMS_START);
        int endIdx   = stdout.indexOf(LMS_END);
        if (startIdx == -1 || endIdx == -1 || endIdx <= startIdx) {
            return stdout;
        }
        return stdout.substring(startIdx + LMS_START.length(), endIdx).trim();
    }

    private String extractLogsFromStdout(String stdout) {
        if (stdout == null) return null;
        int startIdx = stdout.indexOf(LMS_START);
        int endIdx   = stdout.indexOf(LMS_END);
        if (startIdx == -1 || endIdx == -1 || endIdx <= startIdx) {
            return "";
        }
        String before = stdout.substring(0, startIdx);
        String after  = stdout.substring(endIdx + LMS_END.length());
        return (before + after).trim();
    }

    // ── Utility ──────────────────────────────────────────────────────────────────

    private boolean outputsMatch(String actual, String expected) {
        if (expected == null) return true;
        return normalizeOutput(actual).equals(normalizeOutput(expected));
    }

    private String normalizeOutput(String s) {
        if (s == null) return "";
        return s.replace("\\n", "\n").replace("\r\n", "\n").trim();
    }

    private void validateLanguage(CodingExercise exercise, String language) {
        if (language == null || language.isBlank()) {
            throw new IllegalArgumentException("Language is required");
        }
        if (exercise.getAllowedLanguages() != null && !exercise.getAllowedLanguages().isEmpty()) {
            boolean allowed = exercise.getAllowedLanguages().stream()
                    .anyMatch(l -> l.equalsIgnoreCase(language));
            if (!allowed) {
                throw new IllegalArgumentException("Language not allowed for this exercise: " + language);
            }
        }
    }

    private void awardXp(CodingExercise exercise, String studentId) {
        int xp = switch (exercise.getDifficulty() != null ? exercise.getDifficulty() : DifficultyLevel.MEDIUM) {
            case EASY -> 10;
            case HARD -> 50;
            default   -> 25;
        };
        try {
            restTemplate.postForObject(
                    "http://user-service/api/user/gamification/" + studentId + "/xp?amount=" + xp,
                    null, String.class);
        } catch (Exception ignored) {
            // gamification is best-effort — never fail a submission because of it
        }
    }

    private String buildMessage(SubmissionStatus status, int passed, int total) {
        return switch (status) {
            case ACCEPTED          -> "Accepted — " + passed + "/" + total + " tests passed";
            case WRONG_ANSWER      -> "Wrong Answer — " + passed + "/" + total + " tests passed";
            case COMPILE_ERROR     -> "Compile Error";
            case RUNTIME_ERROR     -> "Runtime Error — " + passed + "/" + total + " tests passed";
            case TIME_LIMIT_EXCEEDED -> "Time Limit Exceeded";
            case MEMORY_LIMIT_EXCEEDED -> "Memory Limit Exceeded";
            case PENDING           -> "Evaluation en cours...";
            default                -> "Internal Error";
        };
    }

    private SubmissionStatus mapFailureStatus(SubmissionStatus status) {
        if (status == null) return SubmissionStatus.INTERNAL_ERROR;
        return status;
    }

    private String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        return b;
    }

    private TestCaseResultDto toResultDto(TestCaseResult r) {
        TestCaseResultDto dto = new TestCaseResultDto();
        dto.setIndex(r.getCaseIndex());
        dto.setPassed(r.isPassed());
        dto.setHidden(r.isHidden());
        dto.setStdout(r.isHidden() ? null : r.getStdout());
        dto.setLogs(r.isHidden() ? null : r.getLogs());
        dto.setStderr(r.getStderr());
        dto.setExecutionTimeMs(r.getExecutionTimeMs());
        return dto;
    }
}
