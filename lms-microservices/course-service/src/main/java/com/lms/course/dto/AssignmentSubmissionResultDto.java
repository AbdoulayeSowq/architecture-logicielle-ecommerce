package com.lms.course.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AssignmentSubmissionResultDto {
    private Long id;
    private Double score;
    private LocalDateTime submissionDate;
    private String feedback;
    private List<AnswerResultDto> answers;

    public static class AnswerResultDto {
        private Long questionId;
        private String textAnswer;
        private Double scoreAwarded;
        private String aiFeedback;
        private Boolean isCorrect;
        private List<OptionDto> selectedOptions;

        public AnswerResultDto() {}

        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }

        public String getTextAnswer() { return textAnswer; }
        public void setTextAnswer(String textAnswer) { this.textAnswer = textAnswer; }

        public Double getScoreAwarded() { return scoreAwarded; }
        public void setScoreAwarded(Double scoreAwarded) { this.scoreAwarded = scoreAwarded; }

        public String getAiFeedback() { return aiFeedback; }
        public void setAiFeedback(String aiFeedback) { this.aiFeedback = aiFeedback; }

        public Boolean getIsCorrect() { return isCorrect; }
        public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }

        public List<OptionDto> getSelectedOptions() { return selectedOptions; }
        public void setSelectedOptions(List<OptionDto> selectedOptions) { this.selectedOptions = selectedOptions; }
    }

    public static class OptionDto {
        private Long id;
        private String text;

        public OptionDto() {}
        public OptionDto(Long id, String text) { this.id = id; this.text = text; }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
    }

    public AssignmentSubmissionResultDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public LocalDateTime getSubmissionDate() { return submissionDate; }
    public void setSubmissionDate(LocalDateTime submissionDate) { this.submissionDate = submissionDate; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public List<AnswerResultDto> getAnswers() { return answers; }
    public void setAnswers(List<AnswerResultDto> answers) { this.answers = answers; }
}
