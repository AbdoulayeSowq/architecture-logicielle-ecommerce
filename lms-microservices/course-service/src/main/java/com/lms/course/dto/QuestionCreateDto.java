package com.lms.course.dto;

import com.lms.course.entity.Question;

import java.util.List;

public class QuestionCreateDto {
    private String text;
    private String hint;
    private String justification;
    private Integer orderIndex;
    private Integer points;
    private Question.QuestionType type;
    private String competence; // Tag compétence pour l'apprentissage adaptatif ex: "SQL", "Algorithmique"
    private List<QuestionOptionCreateDto> options;

    public QuestionCreateDto() {}

    // Getters and Setters
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

    public Question.QuestionType getType() { return type; }
    public void setType(Question.QuestionType type) { this.type = type; }

    public String getCompetence() { return competence; }
    public void setCompetence(String competence) { this.competence = competence; }

    public List<QuestionOptionCreateDto> getOptions() { return options; }
    public void setOptions(List<QuestionOptionCreateDto> options) { this.options = options; }
}
