package com.lms.course.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Séance (Course)
 * Représente une séance de cours au sein d'un module (EC)
 * Exemple: Séance 1 (CM) du module "Administration Systèmes" le 15/04/2026
 * 
 * Terminologie:
 * - UE (Unité d'Enseignement) = TeachingUnit
 * - Module/EC (Élément Constitutif) = CModule
 * - Séance = Course
 */
@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String cId;

    private String title;
    private String description;
    private String lecturer;
    private Long duration; // Duration in year
    private String level;
    private String language;
    private String format; // Can be 'online', 'in-person', or 'hybrid'
    private Long credits;

    private Long departmentId;

    private String status; // DRAFT, PUBLISHED, ARCHIVED
    
    @Column(columnDefinition = "TEXT")
    private String contentBlocs;
    
    private LocalDate datePublication;
    private Double noteAverage;
    private Integer xpRecompense;
    private String version;

    // ======================== CHAMPS SÉANCE (NOUVEAUX) ========================

    /** Date et heure de la séance */
    private LocalDateTime sessionDate;

    /** Numéro d'ordre dans le module (1, 2, 3...) */
    private Integer ordre;

    /** Durée de la séance en minutes */
    private Integer duree;

    /** Type de séance */
    private String typeSeance; // COURS_MAGISTRAL, TD, TP, TPE

    /** Objectifs pédagogiques de la séance */
    private String objectifs;

    /** Contenu/résumé de la séance */
    private String contenu;

    // ======================== RELATIONS ========================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    @JsonIgnore
    private CModule module;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore  // Éviter circular reference
    private Set<Material> materials = new HashSet<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    @JsonIgnore  // Éviter circular reference
    private Set<Quiz> quizzes = new HashSet<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @Transient
    private Boolean hasAttendance = false;

    private Boolean autoCreateMeeting = false;
    private String meetingRoomName;

    public Course() {}

    @PrePersist
    protected void onCreate() {
        int randomNum = (int)(Math.random() * 9000) + 1000;
        this.cId = "CO" + randomNum;
        this.createdDate = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCId() { return cId; }
    public void setCId(String cId) { this.cId = cId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLecturer() { return lecturer; }
    public void setLecturer(String lecturer) { this.lecturer = lecturer; }

    public Long getDuration() { return duration; }
    public void setDuration(Long duration) { this.duration = duration; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public Long getCredits() { return credits; }
    public void setCredits(Long credits) { this.credits = credits; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getContentBlocs() { return contentBlocs; }
    public void setContentBlocs(String contentBlocs) { this.contentBlocs = contentBlocs; }

    public LocalDate getDatePublication() { return datePublication; }
    public void setDatePublication(LocalDate datePublication) { this.datePublication = datePublication; }

    public Double getNoteAverage() { return noteAverage; }
    public void setNoteAverage(Double noteAverage) { this.noteAverage = noteAverage; }

    public Integer getXpRecompense() { return xpRecompense; }
    public void setXpRecompense(Integer xpRecompense) { this.xpRecompense = xpRecompense; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public LocalDateTime getSessionDate() { return sessionDate; }
    public void setSessionDate(LocalDateTime sessionDate) { this.sessionDate = sessionDate; }

    public Integer getOrdre() { return ordre; }
    public void setOrdre(Integer ordre) { this.ordre = ordre; }

    public Integer getDuree() { return duree; }
    public void setDuree(Integer duree) { this.duree = duree; }

    public String getTypeSeance() { return typeSeance; }
    public void setTypeSeance(String typeSeance) { this.typeSeance = typeSeance; }

    public String getObjectifs() { return objectifs; }
    public void setObjectifs(String objectifs) { this.objectifs = objectifs; }

    public String getContenu() { return contenu; }
    public void setContenu(String contenu) { this.contenu = contenu; }

    public CModule getModule() { return module; }
    public void setModule(CModule module) { this.module = module; }

    public Set<Material> getMaterials() { return materials; }
    public void setMaterials(Set<Material> materials) { this.materials = materials; }

    public Set<Quiz> getQuizzes() { return quizzes; }
    public void setQuizzes(Set<Quiz> quizzes) { this.quizzes = quizzes; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }

    public Boolean getHasAttendance() { return hasAttendance; }
    public void setHasAttendance(Boolean hasAttendance) { this.hasAttendance = hasAttendance; }

    public Boolean getAutoCreateMeeting() { return autoCreateMeeting; }
    public void setAutoCreateMeeting(Boolean autoCreateMeeting) { this.autoCreateMeeting = autoCreateMeeting; }

    public String getMeetingRoomName() { return meetingRoomName; }
    public void setMeetingRoomName(String meetingRoomName) { this.meetingRoomName = meetingRoomName; }
}
