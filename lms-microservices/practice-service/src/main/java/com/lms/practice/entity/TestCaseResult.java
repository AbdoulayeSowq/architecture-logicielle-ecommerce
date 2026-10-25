package com.lms.practice.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "test_case_results")
public class TestCaseResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private CodeSubmission submission;

    @Column(name = "test_case_id")
    private Long testCaseId;

    @Column(name = "case_index")
    private int caseIndex;

    private boolean passed;

    @Column(columnDefinition = "TEXT")
    private String stdout;

    @Column(columnDefinition = "TEXT")
    private String logs;

    @Column(columnDefinition = "TEXT")
    private String stderr;

    @Column(name = "execution_time_ms")
    private Long executionTimeMs;

    private boolean hidden;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CodeSubmission getSubmission() { return submission; }
    public void setSubmission(CodeSubmission submission) { this.submission = submission; }
    public Long getTestCaseId() { return testCaseId; }
    public void setTestCaseId(Long testCaseId) { this.testCaseId = testCaseId; }
    public int getCaseIndex() { return caseIndex; }
    public void setCaseIndex(int caseIndex) { this.caseIndex = caseIndex; }
    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }
    public String getStdout() { return stdout; }
    public void setStdout(String stdout) { this.stdout = stdout; }
    public String getLogs() { return logs; }
    public void setLogs(String logs) { this.logs = logs; }
    public String getStderr() { return stderr; }
    public void setStderr(String stderr) { this.stderr = stderr; }
    public Long getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(Long executionTimeMs) { this.executionTimeMs = executionTimeMs; }
    public boolean isHidden() { return hidden; }
    public void setHidden(boolean hidden) { this.hidden = hidden; }
}
