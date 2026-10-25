package com.lms.practice.dto;

public class HintResponseDto {
    private int level;
    private String hint;
    private int totalHints;

    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    public String getHint() { return hint; }
    public void setHint(String hint) { this.hint = hint; }
    public int getTotalHints() { return totalHints; }
    public void setTotalHints(int totalHints) { this.totalHints = totalHints; }
}
