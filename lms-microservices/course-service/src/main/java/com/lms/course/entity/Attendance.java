package com.lms.course.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "attendance")
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "module_id", nullable = false)
    private CModule module;
    
    private Long courseId; // Identifiant de la séance (Course)
    
    private String studentId;
    private LocalDate date;
    private java.time.LocalDateTime scanDateTime;
    private String status; // PRESENT, ABSENT, LATE, EXCUSED

    public Attendance() {}

    @PrePersist
    protected void onCreate() {
        if (this.date == null) {
            this.date = LocalDate.now();
        }
        if (this.scanDateTime == null) {
            this.scanDateTime = java.time.LocalDateTime.now();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CModule getModule() { return module; }
    public void setModule(CModule module) { this.module = module; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public java.time.LocalDateTime getScanDateTime() { return scanDateTime; }
    public void setScanDateTime(java.time.LocalDateTime scanDateTime) { this.scanDateTime = scanDateTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
