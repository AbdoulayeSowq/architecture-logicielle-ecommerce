package com.lms.practice.controller;

import com.lms.practice.dto.*;
import com.lms.practice.service.PracticeService;
import com.lms.practice.service.PracticeSubmissionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/practice")
public class PracticeController {

    private final PracticeService practiceService;
    private final PracticeSubmissionService submissionService;

    public PracticeController(PracticeService practiceService,
                               PracticeSubmissionService submissionService) {
        this.practiceService = practiceService;
        this.submissionService = submissionService;
    }

    // ── Exercise CRUD ──────────────────────────────────────────────────────────

    @GetMapping("/exercises")
    public List<CodingExerciseSummaryDto> listExercises(
            @RequestParam(required = false) Long moduleId,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String competence,
            @RequestParam(defaultValue = "false") boolean lecturerView,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return practiceService.listExercises(moduleId, difficulty, competence, lecturerView, page, size);
    }

    @GetMapping("/exercises/{id}")
    public CodingExerciseDetailDto getExercise(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean lecturerView) {
        return lecturerView
                ? practiceService.getExerciseForLecturer(id)
                : practiceService.getExerciseForStudent(id);
    }

    @PostMapping("/exercises")
    public ResponseEntity<CodingExerciseDetailDto> createExercise(@Valid @RequestBody CodingExerciseCreateDto dto) {
        return ResponseEntity.status(201).body(practiceService.createExercise(dto));
    }

    @PutMapping("/exercises/{id}")
    public CodingExerciseDetailDto updateExercise(@PathVariable Long id,
                                                   @Valid @RequestBody CodingExerciseCreateDto dto) {
        return practiceService.updateExercise(id, dto);
    }

    @DeleteMapping("/exercises/{id}")
    public ResponseEntity<Void> deleteExercise(@PathVariable Long id) {
        practiceService.deleteExercise(id);
        return ResponseEntity.noContent().build();
    }

    // ── Code Execution ─────────────────────────────────────────────────────────

    /**
     * Soumet le code pour évaluation complète (tous les test cases, y compris hidden).
     * Retourne immédiatement avec { submissionId, status: "PENDING" }.
     * Le client doit poller GET /submissions/{id}/status pour le résultat final.
     * Header X-User-Username injecté par la gateway depuis le JWT validé.
     */
    @PostMapping("/exercises/{id}/submit")
    public ResponseEntity<SubmissionResultDto> submit(
            @PathVariable Long id,
            @Valid @RequestBody CodeSubmitRequestDto request,
            @RequestHeader(value = "X-User-Username", defaultValue = "anonymous") String studentId) {
        return ResponseEntity.accepted().body(submissionService.submit(id, request, studentId));
    }

    /**
     * Exécute seulement les cas publics (pas de persistance).
     * Synchrone — retourne le résultat directement.
     */
    @PostMapping("/exercises/{id}/run")
    public SubmissionResultDto run(
            @PathVariable Long id,
            @Valid @RequestBody CodeSubmitRequestDto request,
            @RequestHeader(value = "X-User-Username", defaultValue = "anonymous") String studentId) {
        return submissionService.run(id, request, studentId);
    }

    /** Playground libre — pas d'exercice associé, pas de persistance. */
    @PostMapping("/playground/run")
    public SubmissionResultDto runPlayground(@Valid @RequestBody CodeSubmitRequestDto request) {
        return submissionService.runPlayground(request);
    }

    // ── Submission Status (polling async) ──────────────────────────────────────

    /**
     * Polling endpoint pour suivre une soumission async.
     * Tant que status == PENDING, le résultat n'est pas encore disponible.
     * Recommandation : poll toutes les 1-2 secondes.
     */
    @GetMapping("/submissions/{submissionId}/status")
    public SubmissionResultDto getSubmissionStatus(
            @PathVariable Long submissionId,
            @RequestHeader(value = "X-User-Username", defaultValue = "anonymous") String studentId) {
        return submissionService.getSubmissionStatus(submissionId, studentId);
    }

    // ── Submission History ─────────────────────────────────────────────────────

    @GetMapping("/exercises/{id}/submissions")
    public List<SubmissionHistoryDto> getHistory(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Username", defaultValue = "anonymous") String studentId) {
        return submissionService.getHistory(id, studentId);
    }

    @GetMapping("/submissions/{submissionId}")
    public SubmissionResultDto getSubmission(
            @PathVariable Long submissionId,
            @RequestHeader(value = "X-User-Username", defaultValue = "anonymous") String studentId) {
        return submissionService.getSubmissionDetail(submissionId, studentId);
    }

    // ── Stats & Leaderboard ────────────────────────────────────────────────────

    @GetMapping("/exercises/{id}/stats")
    public ExerciseStatsDto getStats(@PathVariable Long id) {
        return practiceService.getStats(id);
    }

    @GetMapping("/exercises/{id}/leaderboard")
    public List<LeaderboardEntryDto> getLeaderboard(
            @PathVariable Long id,
            @RequestParam(defaultValue = "20") int limit) {
        return submissionService.getLeaderboard(id, limit);
    }

    // ── Hints ──────────────────────────────────────────────────────────────────

    @GetMapping("/exercises/{id}/hints/{level}")
    public HintResponseDto getHint(
            @PathVariable Long id,
            @PathVariable int level,
            @RequestHeader(value = "X-User-Username", defaultValue = "anonymous") String studentId) {
        return practiceService.getHint(id, level, studentId);
    }

    // ── Community Solutions (non implémentées — retournent [] proprement) ──────

    @GetMapping("/exercises/{id}/solutions")
    public ResponseEntity<?> getSolutions(@PathVariable Long id) {
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/exercises/{id}/solutions")
    public ResponseEntity<?> postSolution(@PathVariable Long id, @RequestBody Object body) {
        return ResponseEntity.status(501).body("Community solutions not yet implemented");
    }

    @GetMapping("/solutions/{solutionId}")
    public ResponseEntity<?> getSolution(@PathVariable Long solutionId) {
        return ResponseEntity.status(501).body("Community solutions not yet implemented");
    }

    @PostMapping("/solutions/{solutionId}/vote")
    public ResponseEntity<?> vote(@PathVariable Long solutionId, @RequestBody Object body) {
        return ResponseEntity.status(501).body("Community solutions not yet implemented");
    }

    @GetMapping("/solutions/{solutionId}/comments")
    public ResponseEntity<?> getComments(@PathVariable Long solutionId) {
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/solutions/{solutionId}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long solutionId, @RequestBody Object body) {
        return ResponseEntity.status(501).body("Community solutions not yet implemented");
    }

    // ── AI Generation (stub) ───────────────────────────────────────────────────

    @PostMapping("/exercises/generate")
    public ResponseEntity<?> generateDraft(@RequestBody Object body) {
        return ResponseEntity.status(501).body("AI generation not yet implemented");
    }
}
