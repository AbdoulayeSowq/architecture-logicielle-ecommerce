package com.lms.course.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "integrity_reports")
public class IntegrityReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "quiz_result_id", nullable = true)
    @JsonIgnore
    private QuizResult quizResult;

    @OneToOne
    @JoinColumn(name = "submission_id", nullable = true)
    @JsonIgnore
    private Submission submission;

    private Integer integrityScore; // 0-100
    private Integer mouseExitCount;
    private Integer tabSwitchCount;
    private Boolean autoSubmitted;
    @ElementCollection
    private List<String> suspiciousVideoSegments; // URLs or timestamps
    private String notes;

    public IntegrityReport() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public QuizResult getQuizResult() { return quizResult; }
    public void setQuizResult(QuizResult quizResult) { this.quizResult = quizResult; }

    public Submission getSubmission() { return submission; }
    public void setSubmission(Submission submission) { this.submission = submission; }

    public Integer getIntegrityScore() { return integrityScore; }
    public void setIntegrityScore(Integer integrityScore) { this.integrityScore = integrityScore; }

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
