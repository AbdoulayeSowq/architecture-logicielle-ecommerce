package com.lms.course.dto;

import com.lms.course.entity.Quiz;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class QuizDetailDto {
    private Long id;
    private String title;
    private String description;
    private Quiz.TypeQuiz typeQuiz;
    private Integer timeLimit;
    private Boolean timeLimitPerQuestion;
    private Quiz.DocumentMode documentMode;
    private Boolean randomizeQuestions;
    private Boolean randomizeAnswers;
    private Integer maxAttempts;
    private LocalDateTime publishDate;
    private LocalDateTime dueDate;
    private Double passingScore;
    private Long moduleId;
    private String moduleName;
    private List<QuestionDto> questions;

    public QuizDetailDto() {}

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

    public Boolean getRandomizeAnswers() { return randomizeAnswers; }
    public void setRandomizeAnswers(Boolean randomizeAnswers) { this.randomizeAnswers = randomizeAnswers; }

    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }

    public LocalDateTime getPublishDate() { return publishDate; }
    public void setPublishDate(LocalDateTime publishDate) { this.publishDate = publishDate; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public Double getPassingScore() { return passingScore; }
    public void setPassingScore(Double passingScore) { this.passingScore = passingScore; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public String getModuleName() { return moduleName; }
    public void setModuleName(String moduleName) { this.moduleName = moduleName; }

    public List<QuestionDto> getQuestions() { return questions; }
    public void setQuestions(List<QuestionDto> questions) { this.questions = questions; }

    // For students: hides correct answers and justification
    public static QuizDetailDto fromEntity(Quiz q, boolean hideCorrectAnswers) {
        QuizDetailDto dto = new QuizDetailDto();
        dto.setId(q.getId());
        dto.setTitle(q.getTitle());
        dto.setDescription(q.getDescription());
        dto.setTypeQuiz(q.getTypeQuiz());
        dto.setTimeLimit(q.getTimeLimit());
        dto.setTimeLimitPerQuestion(q.getTimeLimitPerQuestion());
        dto.setDocumentMode(q.getDocumentMode());
        dto.setRandomizeQuestions(q.getRandomizeQuestions());
        dto.setRandomizeAnswers(q.getRandomizeAnswers());
        dto.setMaxAttempts(q.getMaxAttempts());
        dto.setPublishDate(q.getPublishDate());
        dto.setDueDate(q.getDueDate());
        dto.setPassingScore(q.getPassingScore());
        if (q.getModule() != null) {
            dto.setModuleId(q.getModule().getId());
            dto.setModuleName(q.getModule().getName());
        }
        if (q.getQuestions() != null) {
            dto.setQuestions(q.getQuestions().stream()
                .map(question -> QuestionDto.fromEntity(question, hideCorrectAnswers))
                .collect(Collectors.toList()));
        }
        return dto;
    }

    // Nested DTOs
    public static class QuestionDto {
        private Long id;
        private String text;
        private String hint;
        private String justification;
        private Integer orderIndex;
        private Integer points;
        private String type;
        private String competence;
        private List<OptionDto> options;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public String getHint() { return hint; }
        public void setHint(String hint) { this.hint = hint; }
        public String getJustification() { return justification; }
        public void setJustification(String justification) { this.justification = justification; }
        public Integer getOrderIndex() { return orderIndex; }
        public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
        public Integer getPoints() { return points; }
        public void setPoints(Integer points) { this.points = points; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getCompetence() { return competence; }
        public void setCompetence(String competence) { this.competence = competence; }
        public List<OptionDto> getOptions() { return options; }
        public void setOptions(List<OptionDto> options) { this.options = options; }

        public static QuestionDto fromEntity(com.lms.course.entity.Question q, boolean hideCorrectAnswers) {
            QuestionDto dto = new QuestionDto();
            dto.setId(q.getId());
            dto.setText(q.getText());
            dto.setHint(q.getHint());
            dto.setJustification(hideCorrectAnswers ? null : q.getJustification());
            dto.setOrderIndex(q.getOrderIndex());
            dto.setPoints(q.getPoints());
            dto.setType(q.getType() != null ? q.getType().name() : null);
            dto.setCompetence(q.getCompetence());
            if (q.getOptions() != null) {
                dto.setOptions(q.getOptions().stream()
                    .map(o -> OptionDto.fromEntity(o, hideCorrectAnswers))
                    .collect(Collectors.toList()));
            }
            return dto;
        }
    }

    public static class OptionDto {
        private Long id;
        private String text;
        private Boolean correct;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public Boolean getCorrect() { return correct; }
        public void setCorrect(Boolean correct) { this.correct = correct; }

        public static OptionDto fromEntity(com.lms.course.entity.QuestionOption o, boolean hideCorrectAnswers) {
            OptionDto dto = new OptionDto();
            dto.setId(o.getId());
            dto.setText(o.getText());
            dto.setCorrect(hideCorrectAnswers ? null : o.isCorrect());
            return dto;
        }
    }
}
