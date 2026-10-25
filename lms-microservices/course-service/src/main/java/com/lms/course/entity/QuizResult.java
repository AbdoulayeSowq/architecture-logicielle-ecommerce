package com.lms.course.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "quiz_results")
public class QuizResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonIgnore
    private Quiz quiz;

    private String studentId;
    private Double score;
    private LocalDateTime startedDate;
    private LocalDateTime completedDate;
    private Integer attemptNumber;
    private Boolean passed;

    @OneToMany(mappedBy = "quizResult", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<StudentAnswer> answers;

    @OneToOne(mappedBy = "quizResult", cascade = CascadeType.ALL, orphanRemoval = true)
    private IntegrityReport integrityReport;

    public QuizResult() {}

    @PrePersist
    protected void onCreate() {
        if (this.startedDate == null) {
            this.startedDate = LocalDateTime.now();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Quiz getQuiz() { return quiz; }
    public void setQuiz(Quiz quiz) { this.quiz = quiz; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public LocalDateTime getStartedDate() { return startedDate; }
    public void setStartedDate(LocalDateTime startedDate) { this.startedDate = startedDate; }

    public LocalDateTime getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDateTime completedDate) { this.completedDate = completedDate; }

    public Integer getAttemptNumber() { return attemptNumber; }
    public void setAttemptNumber(Integer attemptNumber) { this.attemptNumber = attemptNumber; }

    public Boolean getPassed() { return passed; }
    public void setPassed(Boolean passed) { this.passed = passed; }

    public List<StudentAnswer> getAnswers() { return answers; }
    public void setAnswers(List<StudentAnswer> answers) { this.answers = answers; }

    public IntegrityReport getIntegrityReport() { return integrityReport; }
    public void setIntegrityReport(IntegrityReport integrityReport) { this.integrityReport = integrityReport; }
}
