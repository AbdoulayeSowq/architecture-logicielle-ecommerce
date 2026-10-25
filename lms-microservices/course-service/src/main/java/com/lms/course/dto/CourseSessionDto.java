package com.lms.course.dto;

import java.time.LocalDateTime;

/**
 * DTO pour créer/mettre à jour une Course Session (Séance)
 */
public class CourseSessionDto {
    
    private String title;
    private String description;
    private LocalDateTime sessionDate;
    private Integer ordre;
    private Integer duree;
    private String typeSeance; // COURS_MAGISTRAL, TD, TP, TPE
    private String objectifs;
    private String contenu;
    private String status; // DRAFT, PUBLISHED
    private String format;
    private Boolean autoCreateMeeting;
    private String meetingRoomName;

    public CourseSessionDto() {}

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

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

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public Boolean getAutoCreateMeeting() { return autoCreateMeeting; }
    public void setAutoCreateMeeting(Boolean autoCreateMeeting) { this.autoCreateMeeting = autoCreateMeeting; }

    public String getMeetingRoomName() { return meetingRoomName; }
    public void setMeetingRoomName(String meetingRoomName) { this.meetingRoomName = meetingRoomName; }
}
