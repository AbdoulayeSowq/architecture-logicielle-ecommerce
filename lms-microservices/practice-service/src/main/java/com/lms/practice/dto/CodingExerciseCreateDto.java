package com.lms.practice.dto;

import com.lms.practice.entity.DifficultyLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CodingExerciseCreateDto {
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    @NotNull(message = "Difficulty is required")
    private DifficultyLevel difficulty;
    
    private String competence;
    private String starterCode;
    private String referenceSolution;
    private List<String> allowedLanguages = new ArrayList<>();
    private String hintsJson;
    private boolean published;
    private Long moduleId;
    
    @NotEmpty(message = "At least one testcase is required")
    private List<TestCaseDto> testCases = new ArrayList<>();
    private String wrapperCode;
    private Map<String, String> languageWrappers = new HashMap<>();
    private Map<String, String> languageStarterCodes = new HashMap<>();
    private String editorial;
    private String videoUrl;
    private String videoTitle;
    private String videoDescription;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public DifficultyLevel getDifficulty() { return difficulty; }
    public void setDifficulty(DifficultyLevel difficulty) { this.difficulty = difficulty; }
    public String getCompetence() { return competence; }
    public void setCompetence(String competence) { this.competence = competence; }
    public String getStarterCode() { return starterCode; }
    public void setStarterCode(String starterCode) { this.starterCode = starterCode; }
    public String getReferenceSolution() { return referenceSolution; }
    public void setReferenceSolution(String referenceSolution) { this.referenceSolution = referenceSolution; }
    public List<String> getAllowedLanguages() { return allowedLanguages; }
    public void setAllowedLanguages(List<String> allowedLanguages) { this.allowedLanguages = allowedLanguages; }
    public String getHintsJson() { return hintsJson; }
    public void setHintsJson(String hintsJson) { this.hintsJson = hintsJson; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }
    public List<TestCaseDto> getTestCases() { return testCases; }
    public void setTestCases(List<TestCaseDto> testCases) { this.testCases = testCases; }
    public String getWrapperCode() { return wrapperCode; }
    public void setWrapperCode(String wrapperCode) { this.wrapperCode = wrapperCode; }
    public Map<String, String> getLanguageWrappers() { return languageWrappers; }
    public void setLanguageWrappers(Map<String, String> languageWrappers) { this.languageWrappers = languageWrappers; }
    public Map<String, String> getLanguageStarterCodes() { return languageStarterCodes; }
    public void setLanguageStarterCodes(Map<String, String> languageStarterCodes) { this.languageStarterCodes = languageStarterCodes; }
    public String getEditorial() { return editorial; }
    public void setEditorial(String editorial) { this.editorial = editorial; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public String getVideoTitle() { return videoTitle; }
    public void setVideoTitle(String videoTitle) { this.videoTitle = videoTitle; }
    public String getVideoDescription() { return videoDescription; }
    public void setVideoDescription(String videoDescription) { this.videoDescription = videoDescription; }
}
