package com.lms.practice.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.practice.dto.*;
import com.lms.practice.entity.CodingExercise;
import com.lms.practice.entity.DifficultyLevel;
import com.lms.practice.exception.NotFoundException;
import com.lms.practice.repository.CodingExerciseRepository;
import com.lms.practice.repository.CodeSubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PracticeService {

    private final CodingExerciseRepository exerciseRepository;
    private final CodeSubmissionRepository submissionRepository;
    private final ObjectMapper objectMapper;

    public PracticeService(CodingExerciseRepository exerciseRepository,
                           CodeSubmissionRepository submissionRepository,
                           ObjectMapper objectMapper) {
        this.exerciseRepository = exerciseRepository;
        this.submissionRepository = submissionRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<CodingExerciseSummaryDto> listExercises(Long moduleId, String difficulty,
                                                         String competence, boolean lecturerView,
                                                         Integer page, Integer size) {
        DifficultyLevel diffEnum = null;
        if (difficulty != null && !difficulty.isBlank()) {
            diffEnum = DifficultyLevel.valueOf(difficulty.toUpperCase());
        }

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.Pageable.unpaged();
        if (page != null && size != null) {
            pageable = org.springframework.data.domain.PageRequest.of(page, size);
        }

        List<CodingExercise> exercises;
        if (lecturerView && moduleId != null) {
            exercises = exerciseRepository.findByModuleId(moduleId, pageable);
        } else if (lecturerView) {
            exercises = exerciseRepository.findAll(pageable).getContent();
        } else {
            exercises = exerciseRepository.findPublishedFiltered(moduleId, diffEnum, competence, pageable);
        }

        List<Object[]> statsList = submissionRepository.findSubmissionStatsGroupedByExercise();
        java.util.Map<Long, long[]> statsMap = statsList.stream().collect(Collectors.toMap(
            row -> (Long) row[0],
            row -> new long[] { ((Number) row[1]).longValue(), ((Number) row[2]).longValue() }
        ));

        return exercises.stream()
                .map(e -> {
                    long[] stats = statsMap.getOrDefault(e.getId(), new long[]{0L, 0L});
                    return PracticeMapper.toSummary(e, stats[0], stats[1]);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CodingExerciseDetailDto getExerciseForStudent(Long id) {
        CodingExercise exercise = findPublishedOrThrow(id);
        return PracticeMapper.toStudentDetail(exercise);
    }

    @Transactional(readOnly = true)
    public CodingExerciseDetailDto getExerciseForLecturer(Long id) {
        CodingExercise exercise = exerciseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exercise not found: " + id));
        return PracticeMapper.toLecturerDetail(exercise);
    }

    @Transactional
    public CodingExerciseDetailDto createExercise(CodingExerciseCreateDto dto) {
        CodingExercise exercise = new CodingExercise();
        applyDto(exercise, dto);
        CodingExercise saved = exerciseRepository.save(exercise);
        return PracticeMapper.toLecturerDetail(saved);
    }

    @Transactional
    public CodingExerciseDetailDto updateExercise(Long id, CodingExerciseCreateDto dto) {
        CodingExercise exercise = exerciseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exercise not found: " + id));
        applyDto(exercise, dto);
        CodingExercise saved = exerciseRepository.save(exercise);
        return PracticeMapper.toLecturerDetail(saved);
    }

    @Transactional
    public void deleteExercise(Long id) {
        if (!exerciseRepository.existsById(id)) {
            throw new NotFoundException("Exercise not found: " + id);
        }
        exerciseRepository.deleteById(id);
    }

    public ExerciseStatsDto getStats(Long exerciseId) {
        CodingExercise exercise = findExerciseOrThrow(exerciseId);
        long total    = submissionRepository.countByExerciseId(exerciseId);
        long accepted = submissionRepository.countAcceptedByExerciseId(exerciseId);
        long uniqueAccepted = submissionRepository.countUniqueAcceptedUsersByExerciseId(exerciseId);

        ExerciseStatsDto stats = new ExerciseStatsDto();
        stats.setExerciseId(exerciseId);
        stats.setTotalSubmissions(total);
        stats.setAcceptedCount(accepted);
        stats.setUniqueAcceptedUsers(uniqueAccepted);
        double rate = total == 0 ? 0.0 : (accepted * 100.0) / total;
        stats.setAcceptanceRatePercent(rate);
        stats.setAcceptanceRateFormatted(String.format(java.util.Locale.US, "%.1f%%", rate));
        stats.setDifficulty(exercise.getDifficulty());
        return stats;
    }

    public HintResponseDto getHint(Long exerciseId, int level, String studentId) {
        CodingExercise exercise = findPublishedOrThrow(exerciseId);
        List<String> hints = parseHints(exercise.getHintsJson());
        if (hints.isEmpty()) {
            throw new NotFoundException("No hints available for this exercise");
        }
        int maxLevel = hints.size();
        if (level < 1 || level > maxLevel) {
            throw new IllegalArgumentException("Hint level must be between 1 and " + maxLevel);
        }
        long failedAttempts = submissionRepository
                .findTop10ByExercise_IdAndStudentIdOrderBySubmittedAtDesc(exerciseId, studentId)
                .stream()
                .filter(s -> s.getScorePercent() == null || s.getScorePercent() < 100)
                .count();
        if (level > 1 && failedAttempts < level - 1) {
            throw new IllegalStateException("Complete more attempts before unlocking hint level " + level);
        }
        HintResponseDto response = new HintResponseDto();
        response.setLevel(level);
        response.setHint(hints.get(level - 1));
        response.setTotalHints(maxLevel);
        return response;
    }

    // ── Package-visible helpers used by PracticeSubmissionService ────────────────

    public CodingExercise findPublishedOrThrow(Long id) {
        CodingExercise exercise = findExerciseOrThrow(id);
        if (!exercise.isPublished()) {
            throw new NotFoundException("Exercise not published: " + id);
        }
        return exercise;
    }

    public CodingExercise findExerciseOrThrow(Long id) {
        return exerciseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Exercise not found: " + id));
    }

    // ── Private helpers ──────────────────────────────────────────────────────────

    private void applyDto(CodingExercise exercise, CodingExerciseCreateDto dto) {
        exercise.setTitle(dto.getTitle());
        exercise.setDescription(dto.getDescription());
        if (dto.getDifficulty() != null) {
            exercise.setDifficulty(dto.getDifficulty());
        }
        exercise.setCompetence(dto.getCompetence());
        exercise.setStarterCode(dto.getStarterCode());
        exercise.setReferenceSolution(dto.getReferenceSolution());
        if (dto.getAllowedLanguages() != null && !dto.getAllowedLanguages().isEmpty()) {
            exercise.setAllowedLanguages(new ArrayList<>(dto.getAllowedLanguages()));
        }
        exercise.setHintsJson(dto.getHintsJson());
        exercise.setWrapperCode(dto.getWrapperCode());
        if (dto.getLanguageWrappers() != null) {
            exercise.setLanguageWrappers(new java.util.HashMap<>(dto.getLanguageWrappers()));
        }
        if (dto.getLanguageStarterCodes() != null) {
            exercise.setLanguageStarterCodes(new java.util.HashMap<>(dto.getLanguageStarterCodes()));
        }
        exercise.setEditorial(dto.getEditorial());
        exercise.setVideoUrl(dto.getVideoUrl());
        exercise.setVideoTitle(dto.getVideoTitle());
        exercise.setVideoDescription(dto.getVideoDescription());
        exercise.setPublished(dto.isPublished());
        exercise.setModuleId(dto.getModuleId());
        PracticeMapper.applyTestCases(exercise, dto.getTestCases());
    }

    private List<String> parseHints(String hintsJson) {
        if (hintsJson == null || hintsJson.isBlank()) return List.of();
        try {
            return objectMapper.readValue(hintsJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of(hintsJson);
        }
    }
}
