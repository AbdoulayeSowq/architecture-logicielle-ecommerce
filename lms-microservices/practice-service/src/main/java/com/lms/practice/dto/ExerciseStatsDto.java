package com.lms.practice.dto;

import com.lms.practice.entity.DifficultyLevel;

public class ExerciseStatsDto {
    private Long exerciseId;
    private long totalSubmissions;
    private long acceptedCount;
    private double acceptanceRatePercent;
    private String acceptanceRateFormatted;
    private long uniqueAcceptedUsers;
    private DifficultyLevel difficulty;

    public Long getExerciseId() { return exerciseId; }
    public void setExerciseId(Long exerciseId) { this.exerciseId = exerciseId; }
    public long getTotalSubmissions() { return totalSubmissions; }
    public void setTotalSubmissions(long totalSubmissions) { this.totalSubmissions = totalSubmissions; }
    public long getAcceptedCount() { return acceptedCount; }
    public void setAcceptedCount(long acceptedCount) { this.acceptedCount = acceptedCount; }
    public double getAcceptanceRatePercent() { return acceptanceRatePercent; }
    public void setAcceptanceRatePercent(double acceptanceRatePercent) { this.acceptanceRatePercent = acceptanceRatePercent; }
    public String getAcceptanceRateFormatted() { return acceptanceRateFormatted; }
    public void setAcceptanceRateFormatted(String acceptanceRateFormatted) { this.acceptanceRateFormatted = acceptanceRateFormatted; }
    public long getUniqueAcceptedUsers() { return uniqueAcceptedUsers; }
    public void setUniqueAcceptedUsers(long uniqueAcceptedUsers) { this.uniqueAcceptedUsers = uniqueAcceptedUsers; }
    public DifficultyLevel getDifficulty() { return difficulty; }
    public void setDifficulty(DifficultyLevel difficulty) { this.difficulty = difficulty; }
}
