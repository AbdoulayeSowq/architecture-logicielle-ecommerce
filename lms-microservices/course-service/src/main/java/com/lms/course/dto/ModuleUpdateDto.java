package com.lms.course.dto;

import java.time.LocalDateTime;

/**
 * DTO for updating a Module (EC - Élément Constitutif)
 */
public class ModuleUpdateDto {

    private String codeEC;        // Code du module (ex: DEV15011)
    private String name;          // Nom du module (ex: "Administration Systèmes")
    private String description;

    // Charge horaire détaillée
    private Integer cmHours;      // Cours Magistral
    private Integer tdHours;      // Travaux Dirigés
    private Integer tpHours;      // Travaux Pratiques
    private Integer tpeHours;     // Travail Personnel Étudiant

    private Integer creditsEC;    // Crédits de l'EC

    private String semester;      // S5, S6
    private String level;         // DIC1, DIC2, DIC3

    private Long teachingUnitId;  // ID de l'UE parente

    private String lecturerUsername;  // Enseignant assigné

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    // Champs de suivi d'avancement
    private Integer completedHours;
    private Boolean isValidated;

    public ModuleUpdateDto() {}

    // Getters and Setters
    public String getCodeEC() { return codeEC; }
    public void setCodeEC(String codeEC) { this.codeEC = codeEC; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getCmHours() { return cmHours; }
    public void setCmHours(Integer cmHours) { this.cmHours = cmHours; }

    public Integer getTdHours() { return tdHours; }
    public void setTdHours(Integer tdHours) { this.tdHours = tdHours; }

    public Integer getTpHours() { return tpHours; }
    public void setTpHours(Integer tpHours) { this.tpHours = tpHours; }

    public Integer getTpeHours() { return tpeHours; }
    public void setTpeHours(Integer tpeHours) { this.tpeHours = tpeHours; }

    public Integer getCreditsEC() { return creditsEC; }
    public void setCreditsEC(Integer creditsEC) { this.creditsEC = creditsEC; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public Long getTeachingUnitId() { return teachingUnitId; }
    public void setTeachingUnitId(Long teachingUnitId) { this.teachingUnitId = teachingUnitId; }

    public String getLecturerUsername() { return lecturerUsername; }
    public void setLecturerUsername(String lecturerUsername) { this.lecturerUsername = lecturerUsername; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public Integer getCompletedHours() { return completedHours; }
    public void setCompletedHours(Integer completedHours) { this.completedHours = completedHours; }

    public Boolean getIsValidated() { return isValidated; }
    public void setIsValidated(Boolean isValidated) { this.isValidated = isValidated; }
}