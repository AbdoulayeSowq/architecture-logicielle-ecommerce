package com.lms.course.dto;

import com.lms.course.entity.Quiz;

import java.time.LocalDateTime;
import java.util.List;

public class QuizCreateDto {
    private String title;
    private String description;
    private Integer timeLimit;
    private Boolean timeLimitPerQuestion;
    private Quiz.TypeQuiz typeQuiz;
    private Quiz.DocumentMode documentMode;
    private Boolean cameraSurveillanceEnabled;
    private Boolean randomizeQuestions;
    private Boolean randomizeAnswers;
    private Integer maxAttempts;
    private LocalDateTime publishDate;
    private LocalDateTime dueDate;
    private Boolean isDraft;
    private Double passingScore;
    private Long moduleId;
    private List<QuestionCreateDto> questions;

    public QuizCreateDto() {}

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getTimeLimit() { return timeLimit; }
    public void setTimeLimit(Integer timeLimit) { this.timeLimit = timeLimit; }

    public Boolean getTimeLimitPerQuestion() { return timeLimitPerQuestion; }
    public void setTimeLimitPerQuestion(Boolean timeLimitPerQuestion) { this.timeLimitPerQuestion = timeLimitPerQuestion; }

    public Quiz.TypeQuiz getTypeQuiz() { return typeQuiz; }
    public void setTypeQuiz(Quiz.TypeQuiz typeQuiz) { this.typeQuiz = typeQuiz; }

    public Quiz.DocumentMode getDocumentMode() { return documentMode; }
    public void setDocumentMode(Quiz.DocumentMode documentMode) { this.documentMode = documentMode; }

    public Boolean getCameraSurveillanceEnabled() { return cameraSurveillanceEnabled; }
    public void setCameraSurveillanceEnabled(Boolean cameraSurveillanceEnabled) { this.cameraSurveillanceEnabled = cameraSurveillanceEnabled; }

    public Boolean getRandomizeQuestions() { return randomizeQuestions; }
    public void setRandomizeQuestions(Boolean randomizeQuestions) { this.randomizeQuestions = randomizeQuestions; }

    public Boolean getRandomizeAnswers() { return randomizeAnswers; }
    public void setRandomizeAnswers(Boolean randomizeAnswers) { this.randomizeAnswers = randomizeAnswers; }

    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }

    public LocalDateTime getPublishDate() { return publishDate; }
    public void setPublishDate(LocalDateTime publishDate) { this.publishDate = publishDate; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public Boolean getIsDraft() { return isDraft; }
    public void setIsDraft(Boolean isDraft) { this.isDraft = isDraft; }

    public Double getPassingScore() { return passingScore; }
    public void setPassingScore(Double passingScore) { this.passingScore = passingScore; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public List<QuestionCreateDto> getQuestions() { return questions; }
    public void setQuestions(List<QuestionCreateDto> questions) { this.questions = questions; }
}
