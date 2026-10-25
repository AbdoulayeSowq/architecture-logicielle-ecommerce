package com.lms.practice.service;

import com.lms.practice.dto.*;
import com.lms.practice.entity.CodingExercise;
import com.lms.practice.entity.TestCase;

import java.util.List;
import java.util.stream.Collectors;

public final class PracticeMapper {

    private PracticeMapper() {}

    public static CodingExerciseSummaryDto toSummary(CodingExercise e) {
        return toSummary(e, 0L, 0L);
    }

    public static CodingExerciseSummaryDto toSummary(CodingExercise e, long total, long accepted) {
        CodingExerciseSummaryDto dto = new CodingExerciseSummaryDto();
        dto.setId(e.getId());
        dto.setTitle(e.getTitle());
        dto.setDifficulty(e.getDifficulty());
        dto.setCompetence(e.getCompetence());
        dto.setPublished(e.isPublished());
        dto.setModuleId(e.getModuleId());
        dto.setTestCaseCount(e.getTestCases() != null ? e.getTestCases().size() : 0);
        dto.setTotalSubmissions(total);
        dto.setAcceptanceRatePercent(total == 0 ? 0.0 : (accepted * 100.0) / total);
        return dto;
    }

    public static TestCaseDto toTestCaseDto(TestCase tc, boolean includeHiddenDetails) {
        TestCaseDto dto = new TestCaseDto();
        dto.setId(tc.getId());
        dto.setOrderIndex(tc.getOrderIndex());
        dto.setWeightPercent(tc.getWeightPercent());
        dto.setHidden(tc.isHidden());
        if (!tc.isHidden() || includeHiddenDetails) {
            dto.setInput(tc.getInput());
            dto.setExpectedOutput(tc.getExpectedOutput());
            dto.setLabel(tc.getLabel());
            dto.setExplanation(tc.getExplanation());
        } else {
            dto.setLabel(tc.getLabel() != null ? tc.getLabel() : "Hidden Test Case");
        }
        return dto;
    }

    public static CodingExerciseDetailDto toStudentDetail(CodingExercise e) {
        CodingExerciseDetailDto dto = new CodingExerciseDetailDto();
        dto.setId(e.getId());
        dto.setTitle(e.getTitle());
        dto.setDescription(e.getDescription());
        dto.setDifficulty(e.getDifficulty());
        dto.setCompetence(e.getCompetence());
        dto.setStarterCode(e.getStarterCode());
        dto.setAllowedLanguages(e.getAllowedLanguages());
        dto.setPublished(e.isPublished());
        dto.setEditorial(e.getEditorial());
        dto.setModuleId(e.getModuleId());
        dto.setTestCaseCount(e.getTestCases() != null ? e.getTestCases().size() : 0);
        dto.setVideoUrl(e.getVideoUrl());
        dto.setVideoTitle(e.getVideoTitle());
        dto.setVideoDescription(e.getVideoDescription());
        List<TestCaseDto> publicCases = e.getTestCases().stream()
                .filter(tc -> !tc.isHidden())
                .map(tc -> toTestCaseDto(tc, false))
                .collect(Collectors.toList());
        dto.setPublicTestCases(publicCases);
        dto.setLanguageStarterCodes(e.getLanguageStarterCodes());
        return dto;
    }

    public static CodingExerciseDetailDto toLecturerDetail(CodingExercise e) {
        CodingExerciseDetailDto dto = toStudentDetail(e);
        dto.setReferenceSolution(e.getReferenceSolution());
        dto.setHintsJson(e.getHintsJson());
        dto.setWrapperCode(e.getWrapperCode());
        dto.setLanguageWrappers(e.getLanguageWrappers());
        dto.setAllTestCases(e.getTestCases().stream()
                .map(tc -> toTestCaseDto(tc, true))
                .collect(Collectors.toList()));
        return dto;
    }

    public static void applyTestCases(CodingExercise exercise, List<TestCaseDto> dtos) {
        exercise.getTestCases().clear();
        if (dtos == null) return;
        int idx = 0;
        for (TestCaseDto dto : dtos) {
            TestCase tc = new TestCase();
            tc.setExercise(exercise);
            tc.setInput(dto.getInput());
            tc.setExpectedOutput(dto.getExpectedOutput());
            tc.setLabel(dto.getLabel());
            tc.setExplanation(dto.getExplanation());
            tc.setHidden(dto.isHidden());
            tc.setOrderIndex(dto.getOrderIndex() > 0 ? dto.getOrderIndex() : idx);
            tc.setWeightPercent(dto.getWeightPercent() > 0 ? dto.getWeightPercent() : 100);
            exercise.getTestCases().add(tc);
            idx++;
        }
    }
}
