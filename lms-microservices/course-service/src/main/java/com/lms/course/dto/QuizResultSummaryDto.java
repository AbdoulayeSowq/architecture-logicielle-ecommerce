package com.lms.course.dto;

import com.lms.course.entity.QuizResult;
import java.time.LocalDateTime;

/**
 * DTO léger pour la liste des résultats quiz d'un étudiant.
 * Expose le titre du quiz et le nom du module (champs non disponibles
 * dans l'entité QuizResult en raison du @JsonIgnore sur quiz).
 */
public class QuizResultSummaryDto {
    private Long id;
    private Long quizId;
    private String quizTitle;
    private Long moduleId;
    private String moduleName;
    private String studentId;
    private Double score;
    private Double scoreOnTwenty;
    private Boolean passed;
    private Integer attemptNumber;
    private LocalDateTime completedDate;
    private Boolean isAssignment = false;

    public QuizResultSummaryDto() {}

    public static QuizResultSummaryDto fromEntity(QuizResult r) {
        QuizResultSummaryDto dto = new QuizResultSummaryDto();
        dto.setIsAssignment(false);
        dto.setId(r.getId());
        dto.setStudentId(r.getStudentId());
        dto.setScore(r.getScore());
        if (r.getScore() != null) {
            dto.setScoreOnTwenty(Math.round((r.getScore() / 100.0 * 20.0) * 100.0) / 100.0);
        } else {
            dto.setScoreOnTwenty(0.0);
        }
        dto.setPassed(r.getPassed());
        dto.setAttemptNumber(r.getAttemptNumber());
        dto.setCompletedDate(r.getCompletedDate());

        if (r.getQuiz() != null) {
            dto.setQuizId(r.getQuiz().getId());
            dto.setQuizTitle(r.getQuiz().getTitle());
            if (r.getQuiz().getModule() != null) {
                dto.setModuleId(r.getQuiz().getModule().getId());
                dto.setModuleName(r.getQuiz().getModule().getName());
            }
        }
        return dto;
    }

    public static QuizResultSummaryDto fromSubmission(com.lms.course.entity.Submission s) {
        QuizResultSummaryDto dto = new QuizResultSummaryDto();
        dto.setId(s.getId());
        dto.setStudentId(s.getStudentId());
        dto.setScore(s.getScore());
        dto.setIsAssignment(true);
        
        double maxScore = s.getAssignment().getMaxScore() != null ? s.getAssignment().getMaxScore() : 100.0;
        if (s.getScore() != null) {
            dto.setScoreOnTwenty(Math.round((s.getScore() / maxScore * 20.0) * 100.0) / 100.0);
            dto.setPassed(dto.getScoreOnTwenty() >= 10.0);
        } else {
            dto.setScoreOnTwenty(0.0);
            dto.setPassed(false);
        }
        
        dto.setAttemptNumber(1);
        dto.setCompletedDate(s.getSubmissionDate());
        
        if (s.getAssignment() != null) {
            dto.setQuizId(s.getAssignment().getId());
            dto.setQuizTitle(s.getAssignment().getTitle());
            if (s.getAssignment().getModule() != null) {
                dto.setModuleId(s.getAssignment().getModule().getId());
                dto.setModuleName(s.getAssignment().getModule().getName());
            }
        }
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getQuizId() { return quizId; }
    public void setQuizId(Long quizId) { this.quizId = quizId; }

    public String getQuizTitle() { return quizTitle; }
    public void setQuizTitle(String quizTitle) { this.quizTitle = quizTitle; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public String getModuleName() { return moduleName; }
    public void setModuleName(String moduleName) { this.moduleName = moduleName; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Double getScoreOnTwenty() { return scoreOnTwenty; }
    public void setScoreOnTwenty(Double scoreOnTwenty) { this.scoreOnTwenty = scoreOnTwenty; }

    public Boolean getPassed() { return passed; }
    public void setPassed(Boolean passed) { this.passed = passed; }

    public Integer getAttemptNumber() { return attemptNumber; }
    public void setAttemptNumber(Integer attemptNumber) { this.attemptNumber = attemptNumber; }

    public LocalDateTime getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDateTime completedDate) { this.completedDate = completedDate; }

    public Boolean getIsAssignment() { return isAssignment; }
    public void setIsAssignment(Boolean isAssignment) { this.isAssignment = isAssignment; }
}
