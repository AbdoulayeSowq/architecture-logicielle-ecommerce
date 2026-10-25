package com.lms.course.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "adaptive_sessions")
public class AdaptiveSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String studentId;

    // @JsonIgnore : "module" est LAZY et jamais explicitement initialisé avant
    // la fin de la transaction (seul son id est accédé dans updateLacunes(),
    // ce qui ne force pas le chargement complet du proxy Hibernate). Sans ce
    // JsonIgnore, la sérialisation Jackson tente d'initialiser le proxy après
    // la fermeture de la Session Hibernate → HttpMessageNotWritableException
    // ("could not initialize proxy ... - no Session"), qui remonte en 500 sur
    // /session/{id}/complete alors que la complétion elle-même a réussi côté
    // base de données. Aucun client (web/mobile) ne lit ce champ dans les
    // réponses de session adaptative.
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    private CModule module;

    @Enumerated(EnumType.STRING)
    private SessionStatus status; // IN_PROGRESS | COMPLETED | ABANDONED

    @Enumerated(EnumType.STRING)
    private Question.DifficultyLevel currentDifficulty; // niveau courant de la session

    private Integer totalQuestions;
    private Integer answeredCount;
    private Integer correctCount;
    private Double scorePercent;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    @Column(columnDefinition = "TEXT")
    private String aiRecommendations; // Plan personnalisé généré par l'IA après la session

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AdaptiveSessionResult> results;

    public enum SessionStatus {
        IN_PROGRESS, COMPLETED, ABANDONED
    }

    @PrePersist
    protected void onCreate() {
        this.startedAt = LocalDateTime.now();
        if (this.status == null) this.status = SessionStatus.IN_PROGRESS;
        if (this.currentDifficulty == null) this.currentDifficulty = Question.DifficultyLevel.EASY;
        if (this.answeredCount == null) this.answeredCount = 0;
        if (this.correctCount == null) this.correctCount = 0;
    }

    public AdaptiveSession() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public CModule getModule() { return module; }
    public void setModule(CModule module) { this.module = module; }

    public SessionStatus getStatus() { return status; }
    public void setStatus(SessionStatus status) { this.status = status; }

    public Question.DifficultyLevel getCurrentDifficulty() { return currentDifficulty; }
    public void setCurrentDifficulty(Question.DifficultyLevel currentDifficulty) { this.currentDifficulty = currentDifficulty; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }

    public Integer getAnsweredCount() { return answeredCount; }
    public void setAnsweredCount(Integer answeredCount) { this.answeredCount = answeredCount; }

    public Integer getCorrectCount() { return correctCount; }
    public void setCorrectCount(Integer correctCount) { this.correctCount = correctCount; }

    public Double getScorePercent() { return scorePercent; }
    public void setScorePercent(Double scorePercent) { this.scorePercent = scorePercent; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public List<AdaptiveSessionResult> getResults() { return results; }
    public void setResults(List<AdaptiveSessionResult> results) { this.results = results; }

    public String getAiRecommendations() { return aiRecommendations; }
    public void setAiRecommendations(String aiRecommendations) { this.aiRecommendations = aiRecommendations; }
}
