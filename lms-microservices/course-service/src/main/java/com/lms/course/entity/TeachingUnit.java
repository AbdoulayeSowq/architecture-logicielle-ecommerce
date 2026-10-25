package com.lms.course.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.List;

/**
 * UE (Unité d'Enseignement)
 * Regroupe plusieurs Modules/Éléments Constitutifs (EC)
 * Exemple: Développement I (DEV1501) regroupant DEV15011, DEV15012, etc.
 * 
 * Terminologie:
 * - UE (Unité d'Enseignement) = TeachingUnit
 * - Module/EC (Élément Constitutif) = CModule
 * - Séance = Course
 */
@Entity
@Table(name = "teaching_units")
public class TeachingUnit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String code;  // Ex: DEV1501, IHMT502

    private String description;

    @Column(nullable = false)
    private String semester;  // S5, S6

    @Column(nullable = false)
    private Integer creditsUE;  // Crédits U.E.

    private Long departmentId;
    private String departmentCode;

    private Long classId;
    private String classCode;

    @OneToMany(mappedBy = "teachingUnit", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore  // Éviter la circular reference JSON
    private List<CModule> modules;

    public TeachingUnit() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public Integer getCreditsUE() { return creditsUE; }
    public void setCreditsUE(Integer creditsUE) { this.creditsUE = creditsUE; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public String getDepartmentCode() { return departmentCode; }
    public void setDepartmentCode(String departmentCode) { this.departmentCode = departmentCode; }

    public Long getClassId() { return classId; }
    public void setClassId(Long classId) { this.classId = classId; }

    public String getClassCode() { return classCode; }
    public void setClassCode(String classCode) { this.classCode = classCode; }

    public List<CModule> getModules() { return modules; }
    public void setModules(List<CModule> modules) { this.modules = modules; }
}
