package com.lms.ai.dto;

import lombok.Data;
import java.util.List;

@Data
public class RemediationRequest {
    private String studentId;
    private Long moduleId;
    private Long quizResultId;
    private String quizTitle;
    private List<WrongQuestion> wrongQuestions;

    @Data
    public static class WrongQuestion {
        private String questionText;
        private String competence;
        private String justification; // Explication de la bonne réponse
        private String correctAnswer;
    }
}
