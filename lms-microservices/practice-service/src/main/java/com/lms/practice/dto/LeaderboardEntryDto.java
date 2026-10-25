package com.lms.practice.dto;

import java.time.LocalDateTime;

public class LeaderboardEntryDto {
    private int rank;
    private String studentId;
    private Integer scorePercent;
    private Long executionTimeMs;
    private LocalDateTime submittedAt;

    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public Integer getScorePercent() { return scorePercent; }
    public void setScorePercent(Integer scorePercent) { this.scorePercent = scorePercent; }
    public Long getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(Long executionTimeMs) { this.executionTimeMs = executionTimeMs; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
}
