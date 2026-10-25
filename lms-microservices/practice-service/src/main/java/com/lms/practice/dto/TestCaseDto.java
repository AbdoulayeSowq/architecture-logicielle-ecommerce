package com.lms.practice.dto;

public class TestCaseDto {
    private Long id;
    private String input;
    private String expectedOutput;
    private String label;
    private String explanation;
    private boolean hidden;
    private int orderIndex;
    private int weightPercent = 100;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public boolean isHidden() { return hidden; }
    public void setHidden(boolean hidden) { this.hidden = hidden; }
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
    public int getWeightPercent() { return weightPercent; }
    public void setWeightPercent(int weightPercent) { this.weightPercent = weightPercent; }
}
