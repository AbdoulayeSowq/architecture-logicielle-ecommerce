package com.lms.course.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Quiz
 * Peut être au niveau Module (couvrant toutes les séances) ou au niveau Course Session (séance spécifique)
 */
@Entity
@Table(name = "quizzes")
public class Quiz {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String description;
    private Integer timeLimit; // in minutes - global or per question?
    private Boolean timeLimitPerQuestion; // true if time limit is per question
    @Enumerated(EnumType.STRING)
    private TypeQuiz typeQuiz;

    // --- Quiz Configuration ---
    @Enumerated(EnumType.STRING)
    private DocumentMode documentMode; // NO_DOCS, PARTIAL, FULL

    private Boolean cameraSurveillanceEnabled;
    private Boolean randomizeQuestions;
    private Boolean randomizeAnswers;
    private Integer maxAttempts; // 1 to unlimited (null for unlimited)
    private LocalDateTime publishDate;
    private LocalDateTime dueDate;
    private Boolean isDraft;
    private Double passingScore; // percentage

    // --- Scope: MODULE ou COURSE ---
    private String scope; // "MODULE" ou "COURSE"

    // --- Relations ---

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    private CModule module; // Pour quiz de module

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course; // Pour quiz de séance (optionnel)

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore  // Éviter circular reference
    private List<Question> questions;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
    @JsonIgnore  // Éviter circular reference
    private List<QuizResult> results;

    public enum DocumentMode {
        NO_DOCS,
        PARTIAL,
        FULL
    }

    public enum TypeQuiz {
        QCM,
        VRAI_FAUX,
        MIXTE
    }

    public Quiz() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getTimeLimit() { return timeLimit; }
    public void setTimeLimit(Integer timeLimit) { this.timeLimit = timeLimit; }

    public Boolean getTimeLimitPerQuestion() { return timeLimitPerQuestion; }
    public void setTimeLimitPerQuestion(Boolean timeLimitPerQuestion) { this.timeLimitPerQuestion = timeLimitPerQuestion; }

    public TypeQuiz getTypeQuiz() { return typeQuiz; }
    public void setTypeQuiz(TypeQuiz typeQuiz) { this.typeQuiz = typeQuiz; }

    public DocumentMode getDocumentMode() { return documentMode; }
    public void setDocumentMode(DocumentMode documentMode) { this.documentMode = documentMode; }

    public Boolean getCameraSurveillanceEnabled() { return cameraSurveillanceEnabled; }
    public void setCameraSurveillanceEnabled(Boolean cameraSurveillanceEnabled) { this.cameraSurveillanceEnabled = cameraSurveillanceEnabled; }

    public Boolean getRandomizeQuestions() { return randomizeQuestions; }
    public void setRandomizeQuestions(Boolean randomizeQuestions) { this.randomizeQuestions = randomizeQuestions; }

    public Boolean getRandomizeAnswers() { return randomizeAnswers; }
    public void setRandomizeAnswers(Boolean randomizeAnswers) { this.randomizeAnswers = randomizeAnswers; }

    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }

    public LocalDateTime getPublishDate() { return publishDate; }
    public void setPublishDate(LocalDateTime publishDate) { this.publishDate = publishDate; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public Boolean getIsDraft() { return isDraft; }
    public void setIsDraft(Boolean isDraft) { this.isDraft = isDraft; }

    public Double getPassingScore() { return passingScore; }
    public void setPassingScore(Double passingScore) { this.passingScore = passingScore; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public CModule getModule() { return module; }
    public void setModule(CModule module) { this.module = module; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public List<Question> getQuestions() { return questions; }
    public void setQuestions(List<Question> questions) { this.questions = questions; }

    public List<QuizResult> getResults() { return results; }
    public void setResults(List<QuizResult> results) { this.results = results; }
}
