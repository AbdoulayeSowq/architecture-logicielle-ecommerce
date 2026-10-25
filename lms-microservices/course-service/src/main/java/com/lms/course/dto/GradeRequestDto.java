package com.lms.course.dto;

public class GradeRequestDto {
    private Long studentId;
    private Long moduleId;
    private Double score;
    private String comments;

    public GradeRequestDto() {}

    // Getters and Setters
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
}
