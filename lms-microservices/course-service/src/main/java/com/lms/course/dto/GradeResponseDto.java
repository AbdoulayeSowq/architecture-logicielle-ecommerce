package com.lms.course.dto;

import java.time.LocalDateTime;

public class GradeResponseDto {
    private Long id;
    private Long studentId;
    private Long moduleId;
    private String moduleName;
    private String codeEC;
    private Double score;
    private String grade;
    private String comments;
    private LocalDateTime createdDate;

    public GradeResponseDto() {}

    public GradeResponseDto(Long id, Long studentId, Long moduleId, String moduleName, String codeEC,
                            Double score, String grade, String comments, LocalDateTime createdDate) {
        this.id = id;
        this.studentId = studentId;
        this.moduleId = moduleId;
        this.moduleName = moduleName;
        this.codeEC = codeEC;
        this.score = score;
        this.grade = grade;
        this.comments = comments;
        this.createdDate = createdDate;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public String getModuleName() { return moduleName; }
    public void setModuleName(String moduleName) { this.moduleName = moduleName; }

    public String getCodeEC() { return codeEC; }
    public void setCodeEC(String codeEC) { this.codeEC = codeEC; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }

    public static GradeResponseDto fromEntity(com.lms.course.entity.Grade g) {
        return new GradeResponseDto(
            g.getId(),
            g.getStudentId(),
            g.getModule() != null ? g.getModule().getId() : null,
            g.getModule() != null ? g.getModule().getName() : null,
            g.getModule() != null ? g.getModule().getCodeEC() : null,
            g.getScore(),
            g.getGrade(),
            g.getComments(),
            g.getCreatedDate()
        );
    }
}
