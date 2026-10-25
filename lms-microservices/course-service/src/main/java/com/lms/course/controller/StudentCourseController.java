package com.lms.course.controller;

import com.lms.course.entity.Course;
import com.lms.course.entity.CModule;
import com.lms.course.exception.NotFoundException;
import com.lms.course.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/studentcourse")
@Tag(name = "Vue Étudiant", description = "Endpoints dédiés à la consultation des cours par les étudiants")
public class StudentCourseController {

    private final CourseService courseService;

    public StudentCourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @Operation(summary = "Cours par module (vue étudiant)", description = "Retourne les cours d'un module accessibles par un étudiant.")
    @GetMapping("/course/module/{moduleId}")
    public ResponseEntity<?> getCoursesByModuleId(@PathVariable Long moduleId) {
        try {
            List<Course> courses = courseService.getCoursesByModuleId(moduleId);
            return new ResponseEntity<>(courses, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get courses", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Modules par cours", description = "Retourne les modules associés à un cours, avec filtre optionnel par niveau.")
    @GetMapping("/module/{courseId}/course")
    public ResponseEntity<?> getModulesByCourseId(
            @PathVariable Long courseId,
            @RequestParam(required = false) String level) {
        try {
            return new ResponseEntity<>(courseService.getModulesByCourseId(courseId, level), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Failed to get modules: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Modules d'un étudiant", description = "Retourne les modules auxquels un étudiant est inscrit via son niveau.")
    @GetMapping("/student/{username:.+}/modules")
    public ResponseEntity<?> getModulesByStudent(@PathVariable String username) {
        try {
            List<CModule> modules = courseService.getModulesByStudent(username);
            return new ResponseEntity<>(modules, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get modules for student: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Étudiants d'un module", description = "Retourne la liste des étudiants inscrits dans un module.")
    @GetMapping("/module/{moduleId}/students")
    public ResponseEntity<?> getStudentsByModule(@PathVariable Long moduleId) {
        try {
            List<Map<String, Object>> students = courseService.getStudentsByModule(moduleId);
            return new ResponseEntity<>(students, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get students for module: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
