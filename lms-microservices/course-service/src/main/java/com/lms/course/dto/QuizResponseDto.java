package com.lms.course.dto;

import com.lms.course.entity.Quiz;

import java.time.LocalDateTime;

public class QuizResponseDto {
    private Long id;
    private String title;
    private String description;
    private Quiz.TypeQuiz typeQuiz;
    private Integer timeLimit;
    private Boolean timeLimitPerQuestion;
    private Quiz.DocumentMode documentMode;
    private Boolean randomizeQuestions;
    private Integer maxAttempts;
    private LocalDateTime publishDate;
    private LocalDateTime dueDate;
    private Boolean isDraft;
    private Double passingScore;
    private Long moduleId;
    private String moduleName;
    private int questionCount;

    public QuizResponseDto() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Quiz.TypeQuiz getTypeQuiz() { return typeQuiz; }
    public void setTypeQuiz(Quiz.TypeQuiz typeQuiz) { this.typeQuiz = typeQuiz; }

    public Integer getTimeLimit() { return timeLimit; }
    public void setTimeLimit(Integer timeLimit) { this.timeLimit = timeLimit; }

    public Boolean getTimeLimitPerQuestion() { return timeLimitPerQuestion; }
    public void setTimeLimitPerQuestion(Boolean timeLimitPerQuestion) { this.timeLimitPerQuestion = timeLimitPerQuestion; }

    public Quiz.DocumentMode getDocumentMode() { return documentMode; }
    public void setDocumentMode(Quiz.DocumentMode documentMode) { this.documentMode = documentMode; }

    public Boolean getRandomizeQuestions() { return randomizeQuestions; }
    public void setRandomizeQuestions(Boolean randomizeQuestions) { this.randomizeQuestions = randomizeQuestions; }

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

    public String getModuleName() { return moduleName; }
    public void setModuleName(String moduleName) { this.moduleName = moduleName; }

    public int getQuestionCount() { return questionCount; }
    public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }

    public static QuizResponseDto fromEntity(Quiz q) {
        QuizResponseDto dto = new QuizResponseDto();
        dto.setId(q.getId());
        dto.setTitle(q.getTitle());
        dto.setDescription(q.getDescription());
        dto.setTypeQuiz(q.getTypeQuiz());
        dto.setTimeLimit(q.getTimeLimit());
        dto.setTimeLimitPerQuestion(q.getTimeLimitPerQuestion());
        dto.setDocumentMode(q.getDocumentMode());
        dto.setRandomizeQuestions(q.getRandomizeQuestions());
        dto.setMaxAttempts(q.getMaxAttempts());
        dto.setPublishDate(q.getPublishDate());
        dto.setDueDate(q.getDueDate());
        dto.setIsDraft(q.getIsDraft());
        dto.setPassingScore(q.getPassingScore());
        if (q.getModule() != null) {
            dto.setModuleId(q.getModule().getId());
            dto.setModuleName(q.getModule().getName());
        }
        dto.setQuestionCount(q.getQuestions() != null ? q.getQuestions().size() : 0);
        
        int total = 0;
        if (q.getQuestions() != null) {
            for (com.lms.course.entity.Question question : q.getQuestions()) {
                total += (question.getPoints() != null ? question.getPoints() : 0);
            }
        }
        dto.setTotalPoints(total);
        
        return dto;
    }

    private int totalPoints;
    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }
}
