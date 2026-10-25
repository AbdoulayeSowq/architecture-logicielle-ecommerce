package com.lms.ai.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "course-service")
public interface CourseClient {

    @GetMapping("/api/course/material/module/{moduleId}")
    List<MaterialDto> getMaterialsByModule(@PathVariable("moduleId") String moduleId);

    @GetMapping("/api/course/module/{moduleId}")
    ModuleDto getModuleById(@PathVariable("moduleId") Long moduleId);

    class ModuleDto {
        private Long id;
        private String name;
        private String description;
        private String level;
        private Integer cmHours;
        private Integer tdHours;
        private Integer tpHours;
        private Integer tpeHours;
        private Integer totalCH;
        private String semester;
        private String codeEC;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }
        public Integer getCmHours() { return cmHours; }
        public void setCmHours(Integer cmHours) { this.cmHours = cmHours; }
        public Integer getTdHours() { return tdHours; }
        public void setTdHours(Integer tdHours) { this.tdHours = tdHours; }
        public Integer getTpHours() { return tpHours; }
        public void setTpHours(Integer tpHours) { this.tpHours = tpHours; }
        public Integer getTpeHours() { return tpeHours; }
        public void setTpeHours(Integer tpeHours) { this.tpeHours = tpeHours; }
        public Integer getTotalCH() { return totalCH; }
        public void setTotalCH(Integer totalCH) { this.totalCH = totalCH; }
        public String getSemester() { return semester; }
        public void setSemester(String semester) { this.semester = semester; }
        public String getCodeEC() { return codeEC; }
        public void setCodeEC(String codeEC) { this.codeEC = codeEC; }
    }

    @GetMapping("/api/course/lacune/student/{studentId}/module/{moduleId}")
    List<LacuneDto> getLacunesByStudentAndModule(
        @PathVariable("studentId") String studentId,
        @PathVariable("moduleId") Long moduleId);

    class LacuneDto {
        private Long id;
        private String studentId;
        private Long moduleId;
        private String competence;
        private String niveau;

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
    }

    class MaterialDto {
        private String id;
        private String title;
        private String type; // PDF, VIDEO, etc.
        private String fileUrl;

        // Getters and Setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getFileUrl() { return fileUrl; }
        public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    }
}
