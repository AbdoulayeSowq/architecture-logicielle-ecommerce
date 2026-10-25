package com.lms.course.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "assignments")
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private Double maxScore;
    
    @ManyToOne
    @JoinColumn(name = "module_id", nullable = false)
    private CModule module;

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<Question> questions;

    private Boolean isAiGenerated;

    private Integer timeLimit; // in minutes

    private Boolean strictIntegrityMode;

    private LocalDateTime createdDate;

    public Assignment() {}

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public Double getMaxScore() { return maxScore; }
    public void setMaxScore(Double maxScore) { this.maxScore = maxScore; }

    public CModule getModule() { return module; }
    public void setModule(CModule module) { this.module = module; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }

    public List<Question> getQuestions() { return questions; }
    public void setQuestions(List<Question> questions) { this.questions = questions; }

    public Boolean getIsAiGenerated() { return isAiGenerated; }
    public void setIsAiGenerated(Boolean isAiGenerated) { this.isAiGenerated = isAiGenerated; }

    public Integer getTimeLimit() { return timeLimit; }
    public void setTimeLimit(Integer timeLimit) { this.timeLimit = timeLimit; }

    public Boolean getStrictIntegrityMode() { return strictIntegrityMode; }
    public void setStrictIntegrityMode(Boolean strictIntegrityMode) { this.strictIntegrityMode = strictIntegrityMode; }
}
