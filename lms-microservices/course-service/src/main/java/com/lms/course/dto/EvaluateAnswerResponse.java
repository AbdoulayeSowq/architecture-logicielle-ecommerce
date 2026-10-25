package com.lms.course.dto;

public class EvaluateAnswerResponse {
    private Double scoreAwarded;
    private String feedback;

    public EvaluateAnswerResponse() {}

    public EvaluateAnswerResponse(Double scoreAwarded, String feedback) {
        this.scoreAwarded = scoreAwarded;
        this.feedback = feedback;
    }

    public Double getScoreAwarded() { return scoreAwarded; }
    public void setScoreAwarded(Double scoreAwarded) { this.scoreAwarded = scoreAwarded; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
}
