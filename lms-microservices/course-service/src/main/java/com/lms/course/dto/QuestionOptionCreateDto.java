package com.lms.course.dto;

public class QuestionOptionCreateDto {
    private String text;
    private Boolean correct;

    public QuestionOptionCreateDto() {}

    // Getters and Setters
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Boolean getCorrect() { return correct; }
    public void setCorrect(Boolean correct) { this.correct = correct; }
}
