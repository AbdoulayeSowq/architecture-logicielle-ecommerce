package com.lms.practice.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "practice_test_cases")
public class TestCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private CodingExercise exercise;

    @Column(columnDefinition = "TEXT")
    private String input;

    @Column(name = "expected_output", columnDefinition = "TEXT")
    private String expectedOutput;

    private String label;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    private boolean hidden = false;

    @Column(name = "order_index")
    private int orderIndex = 0;

    @Column(name = "weight_percent")
    private int weightPercent = 100;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CodingExercise getExercise() { return exercise; }
    public void setExercise(CodingExercise exercise) { this.exercise = exercise; }
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
