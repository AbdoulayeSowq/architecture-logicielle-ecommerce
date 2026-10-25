package com.lms.course.controller;

import com.lms.course.entity.AdaptiveSession;
import com.lms.course.entity.AdaptiveSessionResult;
import com.lms.course.entity.Question;
import com.lms.course.service.AdaptiveQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/course/adaptive")
@RequiredArgsConstructor
public class AdaptiveQuizController {

    private final AdaptiveQuizService adaptiveQuizService;

    @PostMapping("/session/start")
    public ResponseEntity<AdaptiveSession> startSession(
            @RequestParam String studentId,
            @RequestParam Long moduleId) {
        return ResponseEntity.ok(adaptiveQuizService.startSession(studentId, moduleId));
    }

    @GetMapping("/session/{sessionId}/next")
    public ResponseEntity<Question> nextQuestion(
            @PathVariable Long sessionId,
            @RequestParam String studentId) {
        return ResponseEntity.ok(adaptiveQuizService.nextQuestion(sessionId, studentId));
    }

    @PostMapping("/session/{sessionId}/answer")
    public ResponseEntity<AdaptiveSessionResult> submitAnswer(
            @PathVariable Long sessionId,
            @RequestParam String studentId,
            @RequestBody AnswerRequest request) {
        return ResponseEntity.ok(adaptiveQuizService.submitAnswer(
                sessionId, studentId,
                request.getQuestionId(),
                request.getSelectedOptionId(),
                request.getTextAnswer()
        ));
    }

    @PostMapping("/session/{sessionId}/complete")
    public ResponseEntity<AdaptiveSession> completeSession(
            @PathVariable Long sessionId,
            @RequestParam String studentId) {
        return ResponseEntity.ok(adaptiveQuizService.completeSessionManually(sessionId, studentId));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<AdaptiveSession>> getSessions(@RequestParam String studentId) {
        return ResponseEntity.ok(adaptiveQuizService.getStudentSessions(studentId));
    }

    @GetMapping("/sessions/module/{moduleId}")
    public ResponseEntity<List<AdaptiveSession>> getSessionsByModule(
            @RequestParam String studentId,
            @PathVariable Long moduleId) {
        return ResponseEntity.ok(adaptiveQuizService.getStudentSessionsByModule(studentId, moduleId));
    }

    public static class AnswerRequest {
        private Long questionId;
        private String selectedOptionId;
        private String textAnswer;

        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }
        public String getSelectedOptionId() { return selectedOptionId; }
        public void setSelectedOptionId(String selectedOptionId) { this.selectedOptionId = selectedOptionId; }
        public String getTextAnswer() { return textAnswer; }
        public void setTextAnswer(String textAnswer) { this.textAnswer = textAnswer; }
    }
}
