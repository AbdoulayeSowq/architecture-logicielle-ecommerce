package com.lms.practice.dto;

import com.lms.practice.entity.SubmissionStatus;
import java.time.LocalDateTime;
import java.util.List;

public class SubmissionResultDto {

    private Long submissionId;
    private SubmissionStatus status;
    private Integer scorePercent;
    private Integer passedCount;
    private Integer totalCount;
    private String language;
    private String message;           // message lisible, ex: "Wrong Answer on test case 2"
    private Long executionTimeMsMax;  // temps max parmi tous les test cases
    private List<TestCaseResultDto> results;
    private boolean persisted;
    private LocalDateTime submittedAt;

    public Long getSubmissionId() { return submissionId; }
    public void setSubmissionId(Long submissionId) { this.submissionId = submissionId; }

    public SubmissionStatus getStatus() { return status; }
    public void setStatus(SubmissionStatus status) { this.status = status; }

    public Integer getScorePercent() { return scorePercent; }
    public void setScorePercent(Integer scorePercent) { this.scorePercent = scorePercent; }

    public Integer getPassedCount() { return passedCount; }
    public void setPassedCount(Integer passedCount) { this.passedCount = passedCount; }

    public Integer getTotalCount() { return totalCount; }
    public void setTotalCount(Integer totalCount) { this.totalCount = totalCount; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getExecutionTimeMsMax() { return executionTimeMsMax; }
    public void setExecutionTimeMsMax(Long executionTimeMsMax) { this.executionTimeMsMax = executionTimeMsMax; }

    public List<TestCaseResultDto> getResults() { return results; }
    public void setResults(List<TestCaseResultDto> results) { this.results = results; }

    public boolean isPersisted() { return persisted; }
    public void setPersisted(boolean persisted) { this.persisted = persisted; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
}
