package com.lms.course.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AssignmentCreateDto {
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private Double maxScore;
    private Long moduleId;
    private Boolean isAiGenerated;
    private Integer timeLimit;
    private Boolean strictIntegrityMode;
    private List<QuestionCreateDto> questions;

    public AssignmentCreateDto() {}

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public Double getMaxScore() { return maxScore; }
    public void setMaxScore(Double maxScore) { this.maxScore = maxScore; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public Boolean getIsAiGenerated() { return isAiGenerated; }
    public void setIsAiGenerated(Boolean isAiGenerated) { this.isAiGenerated = isAiGenerated; }

    public Integer getTimeLimit() { return timeLimit; }
    public void setTimeLimit(Integer timeLimit) { this.timeLimit = timeLimit; }

    public Boolean getStrictIntegrityMode() { return strictIntegrityMode; }
    public void setStrictIntegrityMode(Boolean strictIntegrityMode) { this.strictIntegrityMode = strictIntegrityMode; }

    public List<QuestionCreateDto> getQuestions() { return questions; }
    public void setQuestions(List<QuestionCreateDto> questions) { this.questions = questions; }
}
