package com.lms.course.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "lacunes")
public class Lacune {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String studentId;

    private Long moduleId;

    private String competence; // ex: "Algorithmique", "SQL"

    private String niveau; // FAIBLE, MOYEN

    private LocalDate detecteLe;

    public Lacune() {}

    @PrePersist
    protected void onCreate() {
        this.detecteLe = LocalDate.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public String getCompetence() { return competence; }
    public void setCompetence(String competence) { this.competence = competence; }

    public String getNiveau() { return niveau; }
    public void setNiveau(String niveau) { this.niveau = niveau; }

    public LocalDate getDetecteLe() { return detecteLe; }
    public void setDetecteLe(LocalDate detecteLe) { this.detecteLe = detecteLe; }
}
