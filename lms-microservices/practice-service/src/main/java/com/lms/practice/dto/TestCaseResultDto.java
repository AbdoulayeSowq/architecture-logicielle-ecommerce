package com.lms.practice.dto;

public class TestCaseResultDto {
    private int index;
    private boolean passed;
    private boolean hidden;
    private String input;
    private String expectedOutput;
    private String stdout;
    private String logs;
    private String stderr;
    private Long executionTimeMs;

    public int getIndex() { return index; }
    public void setIndex(int index) { this.index = index; }
    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }
    public boolean isHidden() { return hidden; }
    public void setHidden(boolean hidden) { this.hidden = hidden; }
    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }
    public String getStdout() { return stdout; }
    public void setStdout(String stdout) { this.stdout = stdout; }
    public String getLogs() { return logs; }
    public void setLogs(String logs) { this.logs = logs; }
    public String getStderr() { return stderr; }
    public void setStderr(String stderr) { this.stderr = stderr; }
    public Long getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(Long executionTimeMs) { this.executionTimeMs = executionTimeMs; }
}
