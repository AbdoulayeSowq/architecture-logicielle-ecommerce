package com.lms.course.dto;

import java.time.LocalDateTime;

public class AtRiskStudentDTO {
    private Long studentId;
    private String fullName;
    private String username;
    private String riskLevel; // HIGH, MEDIUM, LOW
    private String reason;
    private LocalDateTime lastActivity;
    private Double averageGrade;
    private Double trend; // % change in last scores

    public AtRiskStudentDTO() {}

    public AtRiskStudentDTO(Long studentId, String fullName, String username, String riskLevel, String reason, LocalDateTime lastActivity, Double averageGrade, Double trend) {
        this.studentId = studentId;
        this.fullName = fullName;
        this.username = username;
        this.riskLevel = riskLevel;
        this.reason = reason;
        this.lastActivity = lastActivity;
        this.averageGrade = averageGrade;
        this.trend = trend;
    }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDateTime getLastActivity() { return lastActivity; }
    public void setLastActivity(LocalDateTime lastActivity) { this.lastActivity = lastActivity; }
    public Double getAverageGrade() { return averageGrade; }
    public void setAverageGrade(Double averageGrade) { this.averageGrade = averageGrade; }
    public Double getTrend() { return trend; }
    public void setTrend(Double trend) { this.trend = trend; }

    public static AtRiskStudentDTOBuilder builder() {
        return new AtRiskStudentDTOBuilder();
    }

    public static class AtRiskStudentDTOBuilder {
        private Long studentId;
        private String fullName;
        private String username;
        private String riskLevel;
        private String reason;
        private LocalDateTime lastActivity;
        private Double averageGrade;
        private Double trend;

        public AtRiskStudentDTOBuilder studentId(Long studentId) { this.studentId = studentId; return this; }
        public AtRiskStudentDTOBuilder fullName(String fullName) { this.fullName = fullName; return this; }
        public AtRiskStudentDTOBuilder username(String username) { this.username = username; return this; }
        public AtRiskStudentDTOBuilder riskLevel(String riskLevel) { this.riskLevel = riskLevel; return this; }
        public AtRiskStudentDTOBuilder reason(String reason) { this.reason = reason; return this; }
        public AtRiskStudentDTOBuilder lastActivity(LocalDateTime lastActivity) { this.lastActivity = lastActivity; return this; }
        public AtRiskStudentDTOBuilder averageGrade(Double averageGrade) { this.averageGrade = averageGrade; return this; }
        public AtRiskStudentDTOBuilder trend(Double trend) { this.trend = trend; return this; }

        public AtRiskStudentDTO build() {
            return new AtRiskStudentDTO(studentId, fullName, username, riskLevel, reason, lastActivity, averageGrade, trend);
        }
    }
}
