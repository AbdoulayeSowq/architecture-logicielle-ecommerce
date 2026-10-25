package com.lms.course.dto;

import java.util.List;

public class AssignmentSubmissionDto {
    private Long assignmentId;
    private String studentUsername;
    private List<StudentAnswerDto> answers;
    private IntegrityReportDto integrityReport;

    public AssignmentSubmissionDto() {}

    public Long getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(Long assignmentId) {
        this.assignmentId = assignmentId;
    }

    public String getStudentUsername() {
        return studentUsername;
    }

    public void setStudentUsername(String studentUsername) {
        this.studentUsername = studentUsername;
    }

    public List<StudentAnswerDto> getAnswers() {
        return answers;
    }

    public void setAnswers(List<StudentAnswerDto> answers) {
        this.answers = answers;
    }

    public IntegrityReportDto getIntegrityReport() {
        return integrityReport;
    }

    public void setIntegrityReport(IntegrityReportDto integrityReport) {
        this.integrityReport = integrityReport;
    }
}
