package com.lms.announcement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public abstract class AnnouncementDto {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Type is required")
    private String type;

    /**
     * Audience cible : ALL | STUDENTS | LECTURERS | COURSE | CLASS
     * Défaut : ALL si non renseigné.
     */
    private String targetAudience = "ALL";

    /**
     * Identifiant de la cible (courseCode si COURSE, classId si CLASS).
     * Ignoré pour ALL / STUDENTS / LECTURERS.
     */
    private String targetId;
}

