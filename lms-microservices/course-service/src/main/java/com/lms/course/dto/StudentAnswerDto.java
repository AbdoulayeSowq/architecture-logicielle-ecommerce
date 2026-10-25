package com.lms.course.dto;

public class StudentAnswerDto {
    private Long questionId;
    private Long selectedOptionId;
    private java.util.List<Long> selectedOptionIds;
    private String textAnswer;

    public StudentAnswerDto() {}

    // Getters and Setters
    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }

    public Long getSelectedOptionId() { return selectedOptionId; }
    public void setSelectedOptionId(Long selectedOptionId) { this.selectedOptionId = selectedOptionId; }

    public java.util.List<Long> getSelectedOptionIds() { return selectedOptionIds; }
    public void setSelectedOptionIds(java.util.List<Long> selectedOptionIds) { this.selectedOptionIds = selectedOptionIds; }

    public String getTextAnswer() { return textAnswer; }
    public void setTextAnswer(String textAnswer) { this.textAnswer = textAnswer; }
}
