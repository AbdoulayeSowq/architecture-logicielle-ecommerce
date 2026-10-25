package com.lms.practice.dto;

import com.lms.practice.entity.DifficultyLevel;

public class CodingExerciseSummaryDto {
    private Long id;
    private String title;
    private DifficultyLevel difficulty;
    private String competence;
    private boolean published;
    private Long moduleId;
    private int testCaseCount;
    private double acceptanceRatePercent;
    private long totalSubmissions;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public DifficultyLevel getDifficulty() { return difficulty; }
    public void setDifficulty(DifficultyLevel difficulty) { this.difficulty = difficulty; }
    public String getCompetence() { return competence; }
    public void setCompetence(String competence) { this.competence = competence; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }
    public int getTestCaseCount() { return testCaseCount; }
    public void setTestCaseCount(int testCaseCount) { this.testCaseCount = testCaseCount; }
    public double getAcceptanceRatePercent() { return acceptanceRatePercent; }
    public void setAcceptanceRatePercent(double acceptanceRatePercent) { this.acceptanceRatePercent = acceptanceRatePercent; }
    public long getTotalSubmissions() { return totalSubmissions; }
    public void setTotalSubmissions(long totalSubmissions) { this.totalSubmissions = totalSubmissions; }
}
