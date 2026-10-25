package com.lms.course.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificats")
public class Certificat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long moduleId; // optionnel, peut être pour tout le cours

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(nullable = false)
    private Long studentId;

    private String urlPdf;

    @Column(unique = true, nullable = false)
    private String codeVerification;

    private LocalDateTime dateEmission;

    public Certificat() {}

    @PrePersist
    protected void onCreate() {
        this.dateEmission = LocalDateTime.now();
        if (this.codeVerification == null) {
            this.codeVerification = java.util.UUID.randomUUID().toString();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public String getUrlPdf() { return urlPdf; }
    public void setUrlPdf(String urlPdf) { this.urlPdf = urlPdf; }

    public String getCodeVerification() { return codeVerification; }
    public void setCodeVerification(String codeVerification) { this.codeVerification = codeVerification; }

    public LocalDateTime getDateEmission() { return dateEmission; }
    public void setDateEmission(LocalDateTime dateEmission) { this.dateEmission = dateEmission; }
}
