package com.lms.course.dto;

import java.util.List;

public class QuizSubmissionDto {
    private Long quizId;
    private String studentId;
    private List<StudentAnswerDto> answers;
    private IntegrityReportDto integrityReport;

    public QuizSubmissionDto() {}

    // Getters and Setters
    public Long getQuizId() { return quizId; }
    public void setQuizId(Long quizId) { this.quizId = quizId; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public List<StudentAnswerDto> getAnswers() { return answers; }
    public void setAnswers(List<StudentAnswerDto> answers) { this.answers = answers; }

    public IntegrityReportDto getIntegrityReport() { return integrityReport; }
    public void setIntegrityReport(IntegrityReportDto integrityReport) { this.integrityReport = integrityReport; }
}
