package com.lms.practice.dto;

import com.lms.practice.entity.DifficultyLevel;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CodingExerciseDetailDto {
    private Long id;
    private String title;
    private String description;
    private DifficultyLevel difficulty;
    private String competence;
    private String starterCode;
    private Map<String, String> languageStarterCodes = new HashMap<>();
    private Map<String, String> languageWrappers = new HashMap<>();
    private String referenceSolution;
    private List<String> allowedLanguages = new ArrayList<>();
    private boolean published;
    private Long moduleId;
    private List<TestCaseDto> publicTestCases = new ArrayList<>();
    private List<TestCaseDto> allTestCases;
    private int hintsUnlocked;
    private String hintsJson;
    private String wrapperCode;
    private String editorial;
    private int testCaseCount;
    private String videoUrl;
    private String videoTitle;
    private String videoDescription;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public Map<String, String> getLanguageStarterCodes() { return languageStarterCodes; }
    public void setLanguageStarterCodes(Map<String, String> languageStarterCodes) { this.languageStarterCodes = languageStarterCodes; }
    public Map<String, String> getLanguageWrappers() { return languageWrappers; }
    public void setLanguageWrappers(Map<String, String> languageWrappers) { this.languageWrappers = languageWrappers; }
    public String getReferenceSolution() { return referenceSolution; }
    public void setReferenceSolution(String referenceSolution) { this.referenceSolution = referenceSolution; }
    public List<String> getAllowedLanguages() { return allowedLanguages; }
    public void setAllowedLanguages(List<String> allowedLanguages) { this.allowedLanguages = allowedLanguages; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }
    public List<TestCaseDto> getPublicTestCases() { return publicTestCases; }
    public void setPublicTestCases(List<TestCaseDto> publicTestCases) { this.publicTestCases = publicTestCases; }
    public List<TestCaseDto> getAllTestCases() { return allTestCases; }
    public void setAllTestCases(List<TestCaseDto> allTestCases) { this.allTestCases = allTestCases; }
    public int getHintsUnlocked() { return hintsUnlocked; }
    public void setHintsUnlocked(int hintsUnlocked) { this.hintsUnlocked = hintsUnlocked; }
    public String getHintsJson() { return hintsJson; }
    public void setHintsJson(String hintsJson) { this.hintsJson = hintsJson; }
    public String getWrapperCode() { return wrapperCode; }
    public void setWrapperCode(String wrapperCode) { this.wrapperCode = wrapperCode; }
    public String getEditorial() { return editorial; }
    public void setEditorial(String editorial) { this.editorial = editorial; }
    public int getTestCaseCount() { return testCaseCount; }
    public void setTestCaseCount(int testCaseCount) { this.testCaseCount = testCaseCount; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public String getVideoTitle() { return videoTitle; }
    public void setVideoTitle(String videoTitle) { this.videoTitle = videoTitle; }
    public String getVideoDescription() { return videoDescription; }
    public void setVideoDescription(String videoDescription) { this.videoDescription = videoDescription; }
}
