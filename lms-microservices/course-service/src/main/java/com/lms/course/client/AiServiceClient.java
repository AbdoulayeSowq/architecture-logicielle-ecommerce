package com.lms.course.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(name = "ai-service", contextId = "aiAdaptiveClient")
public interface AiServiceClient {

    @PostMapping(value = "/api/ai/adaptive/generate-question",
                 consumes = "application/json", produces = "application/json")
    String generateAdaptiveQuestion(@RequestBody GenerateQuestionRequest request);

    @PostMapping(value = "/api/ai/adaptive/session-recommendations",
                 consumes = "application/json", produces = "text/plain;charset=UTF-8")
    String getSessionRecommendations(@RequestBody SessionRecommendationRequest request);

    class GenerateQuestionRequest {
        private Long moduleId;
        private String difficulty;
        private String competence;
        private List<String> lacunes;
        private List<String> previousQuestions;
        private Double sessionScorePercent;

        public GenerateQuestionRequest() {}

        public Long getModuleId() { return moduleId; }
        public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

        public String getCompetence() { return competence; }
        public void setCompetence(String competence) { this.competence = competence; }

        public List<String> getLacunes() { return lacunes; }
        public void setLacunes(List<String> lacunes) { this.lacunes = lacunes; }

        public List<String> getPreviousQuestions() { return previousQuestions; }
        public void setPreviousQuestions(List<String> previousQuestions) { this.previousQuestions = previousQuestions; }

        public Double getSessionScorePercent() { return sessionScorePercent; }
        public void setSessionScorePercent(Double sessionScorePercent) { this.sessionScorePercent = sessionScorePercent; }
    }

    class SessionRecommendationRequest {
        private Long moduleId;
        private Double scorePercent;
        private Integer answeredCount;
        private Integer correctCount;
        private List<String> lacunes;
        private List<String> strongCompetences;
        private String studentLevel;

        public SessionRecommendationRequest() {}

        public Long getModuleId() { return moduleId; }
        public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

        public Double getScorePercent() { return scorePercent; }
        public void setScorePercent(Double scorePercent) { this.scorePercent = scorePercent; }

        public Integer getAnsweredCount() { return answeredCount; }
        public void setAnsweredCount(Integer answeredCount) { this.answeredCount = answeredCount; }

        public Integer getCorrectCount() { return correctCount; }
        public void setCorrectCount(Integer correctCount) { this.correctCount = correctCount; }

        public List<String> getLacunes() { return lacunes; }
        public void setLacunes(List<String> lacunes) { this.lacunes = lacunes; }

        public List<String> getStrongCompetences() { return strongCompetences; }
        public void setStrongCompetences(List<String> strongCompetences) { this.strongCompetences = strongCompetences; }

        public String getStudentLevel() { return studentLevel; }
        public void setStudentLevel(String studentLevel) { this.studentLevel = studentLevel; }
    }
}
