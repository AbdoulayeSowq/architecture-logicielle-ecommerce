package com.lms.course.dto;

public class EvaluateAnswerRequest {
    private String question;
    private String expectedAnswer;
    private String studentAnswer;
    private Double maxPoints;

    public EvaluateAnswerRequest() {}

    public EvaluateAnswerRequest(String question, String expectedAnswer, String studentAnswer, Double maxPoints) {
        this.question = question;
        this.expectedAnswer = expectedAnswer;
        this.studentAnswer = studentAnswer;
        this.maxPoints = maxPoints;
    }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getExpectedAnswer() { return expectedAnswer; }
    public void setExpectedAnswer(String expectedAnswer) { this.expectedAnswer = expectedAnswer; }

    public String getStudentAnswer() { return studentAnswer; }
    public void setStudentAnswer(String studentAnswer) { this.studentAnswer = studentAnswer; }

    public Double getMaxPoints() { return maxPoints; }
    public void setMaxPoints(Double maxPoints) { this.maxPoints = maxPoints; }
}
