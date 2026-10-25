package com.lms.course.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String text;

    @Column(columnDefinition = "TEXT")
    private String hint;

    @Column(columnDefinition = "TEXT")
    private String justification; // Explication affichée après correction
    private Integer orderIndex;
    private Integer points;
    private String competence; // Tag compétence ex: "SQL", "Algorithmique", "Réseaux"

    @Column(columnDefinition = "boolean DEFAULT false")
    private boolean aiGenerated = false; // true si générée par l'IA adaptative

    @Enumerated(EnumType.STRING)
    private DifficultyLevel difficultyLevel; // EASY | MEDIUM | HARD

    @Enumerated(EnumType.STRING)
    private QuestionType type;

    @ManyToOne
    @JoinColumn(name = "quiz_id") // Rendu nullable
    @JsonIgnore
    private Quiz quiz;

    @ManyToOne
    @JoinColumn(name = "assignment_id")
    @JsonIgnore
    private Assignment assignment;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<QuestionOption> options;

    public enum QuestionType {
        SINGLE_CHOICE,
        MULTIPLE_CHOICE,
        TRUE_FALSE,
        SHORT_ANSWER,
        ESSAY
    }

    public enum DifficultyLevel {
        EASY, MEDIUM, HARD
    }

    public Question() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getHint() { return hint; }
    public void setHint(String hint) { this.hint = hint; }

    public String getJustification() { return justification; }
    public void setJustification(String justification) { this.justification = justification; }

    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }

    public String getCompetence() { return competence; }
    public void setCompetence(String competence) { this.competence = competence; }

    public boolean isAiGenerated() { return aiGenerated; }
    public void setAiGenerated(boolean aiGenerated) { this.aiGenerated = aiGenerated; }

    public DifficultyLevel getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(DifficultyLevel difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public QuestionType getType() { return type; }
    public void setType(QuestionType type) { this.type = type; }

    public Quiz getQuiz() { return quiz; }
    public void setQuiz(Quiz quiz) { this.quiz = quiz; }

    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }

    public List<QuestionOption> getOptions() { return options; }
    public void setOptions(List<QuestionOption> options) { this.options = options; }
}
