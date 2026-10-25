package com.lms.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluateAnswerRequest {
    private String question;
    private String expectedAnswer; // Justification from the teacher
    private String studentAnswer;
    private Double maxPoints;
}
