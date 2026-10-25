package com.lms.course.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Détail complet d'un résultat de quiz avec corrections (pour affichage étudiant).
 * Contient pour chaque question : énoncé, options (avec marquage correct),
 * réponse choisie par l'étudiant, justification, etc.
 */
public class QuizResultDetailDto {
    private Long id;
    private Long quizId;
    private Long moduleId;
    private String quizTitle;
    private String studentId;
    private Double score;          // pourcentage 0-100
    private Double scoreOnTwenty;  // /20
    private Boolean passed;
    private Double passingScore;
    private Integer attemptNumber;
    private Integer maxAttempts;
    private LocalDateTime completedDate;
    private List<QuestionResultDto> questions;

    public QuizResultDetailDto() {}

    public static class QuestionResultDto {
        private Long questionId;
        private String text;
        private String hint;
        private String justification;
        private Integer points;
        private String type;
        private Long selectedOptionId;
        private String textAnswer;
        private Boolean isCorrect;
        private String aiFeedback;
        private Double scoreAwarded;
        private List<OptionResultDto> options;

        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public String getHint() { return hint; }
        public void setHint(String hint) { this.hint = hint; }
        public String getJustification() { return justification; }
        public void setJustification(String justification) { this.justification = justification; }
        public Integer getPoints() { return points; }
        public void setPoints(Integer points) { this.points = points; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public Long getSelectedOptionId() { return selectedOptionId; }
        public void setSelectedOptionId(Long selectedOptionId) { this.selectedOptionId = selectedOptionId; }
        public String getTextAnswer() { return textAnswer; }
        public void setTextAnswer(String textAnswer) { this.textAnswer = textAnswer; }
        public Boolean getIsCorrect() { return isCorrect; }
        public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
        public String getAiFeedback() { return aiFeedback; }
        public void setAiFeedback(String aiFeedback) { this.aiFeedback = aiFeedback; }
        public Double getScoreAwarded() { return scoreAwarded; }
        public void setScoreAwarded(Double scoreAwarded) { this.scoreAwarded = scoreAwarded; }
        public List<OptionResultDto> getOptions() { return options; }
        public void setOptions(List<OptionResultDto> options) { this.options = options; }
    }

    public static class OptionResultDto {
        private Long id;
        private String text;
        private Boolean correct;

        public OptionResultDto() {}
        public OptionResultDto(Long id, String text, Boolean correct) {
            this.id = id; this.text = text; this.correct = correct;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public Boolean getCorrect() { return correct; }
        public void setCorrect(Boolean correct) { this.correct = correct; }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getQuizId() { return quizId; }
    public void setQuizId(Long quizId) { this.quizId = quizId; }
    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }
    public String getQuizTitle() { return quizTitle; }
    public void setQuizTitle(String quizTitle) { this.quizTitle = quizTitle; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
    public Double getScoreOnTwenty() { return scoreOnTwenty; }
    public void setScoreOnTwenty(Double scoreOnTwenty) { this.scoreOnTwenty = scoreOnTwenty; }
    public Boolean getPassed() { return passed; }
    public void setPassed(Boolean passed) { this.passed = passed; }
    public Double getPassingScore() { return passingScore; }
    public void setPassingScore(Double passingScore) { this.passingScore = passingScore; }
    public Integer getAttemptNumber() { return attemptNumber; }
    public void setAttemptNumber(Integer attemptNumber) { this.attemptNumber = attemptNumber; }
    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }
    public LocalDateTime getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDateTime completedDate) { this.completedDate = completedDate; }
    public List<QuestionResultDto> getQuestions() { return questions; }
    public void setQuestions(List<QuestionResultDto> questions) { this.questions = questions; }
}

