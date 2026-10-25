package com.lms.practice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "coding_exercises")
public class CodingExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private DifficultyLevel difficulty = DifficultyLevel.MEDIUM;

    private String competence;

    @Column(name = "starter_code", columnDefinition = "TEXT")
    private String starterCode;

    @Column(name = "reference_solution", columnDefinition = "TEXT")
    private String referenceSolution;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "exercise_allowed_languages", joinColumns = @JoinColumn(name = "exercise_id"))
    @Column(name = "language")
    private List<String> allowedLanguages = new ArrayList<>();

    @Column(name = "hints_json", columnDefinition = "TEXT")
    @Convert(converter = com.lms.practice.config.HintsConverter.class)
    private List<String> hints = new ArrayList<>();

    @Column(name = "wrapper_code", columnDefinition = "TEXT")
    private String wrapperCode;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "exercise_language_wrappers", joinColumns = @JoinColumn(name = "exercise_id"))
    @MapKeyColumn(name = "language")
    @Column(name = "wrapper_code", columnDefinition = "TEXT")
    private Map<String, String> languageWrappers = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "exercise_language_starter_codes", joinColumns = @JoinColumn(name = "exercise_id"))
    @MapKeyColumn(name = "language")
    @Column(name = "starter_code", columnDefinition = "TEXT")
    private Map<String, String> languageStarterCodes = new HashMap<>();

    @Column(columnDefinition = "TEXT")
    private String editorial;

    @Column(name = "video_url")
    private String videoUrl;

    @Column(name = "video_title")
    private String videoTitle;

    @Column(name = "video_description", columnDefinition = "TEXT")
    private String videoDescription;

    private boolean published = false;

    @Column(name = "module_id")
    private Long moduleId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "exercise", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("orderIndex ASC")
    private List<TestCase> testCases = new ArrayList<>();

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
    @Deprecated
    public String getStarterCode() { return starterCode; }
    @Deprecated
    public void setStarterCode(String starterCode) { this.starterCode = starterCode; }
    public String getReferenceSolution() { return referenceSolution; }
    public void setReferenceSolution(String referenceSolution) { this.referenceSolution = referenceSolution; }
    public List<String> getAllowedLanguages() { return allowedLanguages; }
    public void setAllowedLanguages(List<String> allowedLanguages) { this.allowedLanguages = allowedLanguages; }
    public List<String> getHints() { return hints; }
    public void setHints(List<String> hints) { this.hints = hints; }

    @Deprecated
    public String getHintsJson() {
        if (this.hints == null) return "[]";
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(this.hints);
        } catch (Exception e) {
            return "[]";
        }
    }

    @Deprecated
    public void setHintsJson(String hintsJson) {
        if (hintsJson == null || hintsJson.isBlank()) {
            this.hints = new ArrayList<>();
            return;
        }
        try {
            this.hints = new com.fasterxml.jackson.databind.ObjectMapper().readValue(hintsJson, new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
        } catch (Exception e) {
            this.hints = new ArrayList<>(List.of(hintsJson));
        }
    }
    @Deprecated
    public String getWrapperCode() { return wrapperCode; }
    @Deprecated
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
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<TestCase> getTestCases() { return testCases; }
    public void setTestCases(List<TestCase> testCases) { this.testCases = testCases; }

    @PostLoad
    public void postLoad() {
        if (this.starterCode != null && !this.starterCode.isBlank()) {
            if (this.languageStarterCodes == null) {
                this.languageStarterCodes = new HashMap<>();
            }
            if (this.languageStarterCodes.isEmpty()) {
                if (this.allowedLanguages != null && !this.allowedLanguages.isEmpty()) {
                    for (String lang : this.allowedLanguages) {
                        this.languageStarterCodes.put(lang.toLowerCase(), this.starterCode);
                    }
                } else {
                    this.languageStarterCodes.put("python", this.starterCode);
                    this.languageStarterCodes.put("java", this.starterCode);
                    this.languageStarterCodes.put("javascript", this.starterCode);
                }
            }
        }
        if (this.wrapperCode != null && !this.wrapperCode.isBlank()) {
            if (this.languageWrappers == null) {
                this.languageWrappers = new HashMap<>();
            }
            if (this.languageWrappers.isEmpty()) {
                if (this.allowedLanguages != null && !this.allowedLanguages.isEmpty()) {
                    for (String lang : this.allowedLanguages) {
                        this.languageWrappers.put(lang.toLowerCase(), this.wrapperCode);
                    }
                } else {
                    this.languageWrappers.put("python", this.wrapperCode);
                    this.languageWrappers.put("java", this.wrapperCode);
                    this.languageWrappers.put("javascript", this.wrapperCode);
                }
            }
        }
    }
}
