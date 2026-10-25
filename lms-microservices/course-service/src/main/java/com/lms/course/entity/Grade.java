package com.lms.course.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "grades")
public class Grade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long studentId;
    
    @ManyToOne
    @JoinColumn(name = "module_id", nullable = false)
    private CModule module;
    
    private Double score;
    private String grade; // e.g., "A", "B+", "C"
    private String comments;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    public Grade() {}

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public CModule getModule() { return module; }
    public void setModule(CModule module) { this.module = module; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
}
