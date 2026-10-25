package com.lms.course.dto;

import java.util.List;

public class IntegrityReportDto {
    private Integer mouseExitCount;
    private Integer tabSwitchCount;
    private Boolean autoSubmitted;
    private List<String> suspiciousVideoSegments;
    private String notes;

    public IntegrityReportDto() {}

    // Getters and Setters
    public Integer getMouseExitCount() { return mouseExitCount; }
    public void setMouseExitCount(Integer mouseExitCount) { this.mouseExitCount = mouseExitCount; }

    public Integer getTabSwitchCount() { return tabSwitchCount; }
    public void setTabSwitchCount(Integer tabSwitchCount) { this.tabSwitchCount = tabSwitchCount; }

    public Boolean getAutoSubmitted() { return autoSubmitted; }
    public void setAutoSubmitted(Boolean autoSubmitted) { this.autoSubmitted = autoSubmitted; }

    public List<String> getSuspiciousVideoSegments() { return suspiciousVideoSegments; }
    public void setSuspiciousVideoSegments(List<String> suspiciousVideoSegments) { this.suspiciousVideoSegments = suspiciousVideoSegments; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
