package com.lms.course.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "student_answers")
public class StudentAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "quiz_result_id") // Rendu nullable
    @JsonIgnore
    private QuizResult quizResult;

    @ManyToOne
    @JoinColumn(name = "submission_id")
    @JsonIgnore
    private Submission submission;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    @JsonIgnore
    private Question question;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "student_answer_selected_options",
        joinColumns = @JoinColumn(name = "student_answer_id"),
        inverseJoinColumns = @JoinColumn(name = "question_option_id")
    )
    private java.util.List<QuestionOption> selectedOptions;

    private String textAnswer; // for open-ended questions

    private Boolean isCorrect;

    @Column(columnDefinition = "TEXT")
    private String aiFeedback; // feedback généré par l'IA

    private Double scoreAwarded; // note accordée par l'IA ou le prof

    public StudentAnswer() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public QuizResult getQuizResult() { return quizResult; }
    public void setQuizResult(QuizResult quizResult) { this.quizResult = quizResult; }

    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }

    @com.fasterxml.jackson.annotation.JsonProperty("questionId")
    public Long getQuestionId() {
        return question != null ? question.getId() : null;
    }

    public java.util.List<QuestionOption> getSelectedOptions() { return selectedOptions; }
    public void setSelectedOptions(java.util.List<QuestionOption> selectedOptions) { this.selectedOptions = selectedOptions; }

    // Compatibility for single option
    public QuestionOption getSelectedOption() {
        if (selectedOptions == null || selectedOptions.isEmpty()) return null;
        return selectedOptions.get(0);
    }
    public void setSelectedOption(QuestionOption option) {
        if (this.selectedOptions == null) this.selectedOptions = new java.util.ArrayList<>();
        else this.selectedOptions.clear();
        if (option != null) this.selectedOptions.add(option);
    }

    public String getTextAnswer() { return textAnswer; }
    public void setTextAnswer(String textAnswer) { this.textAnswer = textAnswer; }

    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }

    public Submission getSubmission() { return submission; }
    public void setSubmission(Submission submission) { this.submission = submission; }

    public String getAiFeedback() { return aiFeedback; }
    public void setAiFeedback(String aiFeedback) { this.aiFeedback = aiFeedback; }

    public Double getScoreAwarded() { return scoreAwarded; }
    public void setScoreAwarded(Double scoreAwarded) { this.scoreAwarded = scoreAwarded; }
}
