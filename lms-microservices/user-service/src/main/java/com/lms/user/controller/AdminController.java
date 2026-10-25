package com.lms.user.controller;

import com.lms.user.dto.LecturerRequestDto;
import com.lms.user.dto.StudentRequestDto;
import com.lms.user.entity.Lecturer;
import com.lms.user.entity.Student;
import com.lms.user.exception.ConflictException;
import com.lms.user.exception.NotFoundException;
import com.lms.user.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/admin")
@AllArgsConstructor
@Tag(name = "Administration", description = "Gestion des étudiants et enseignants par l'administrateur")
public class AdminController {

    private AdminService adminService;

    @Operation(summary = "Créer un étudiant", description = "Crée un nouveau compte étudiant avec ses informations personnelles et son adresse.")
    @ApiResponse(responseCode = "201", description = "Étudiant créé avec succès")
    @ApiResponse(responseCode = "409", description = "Conflit — l'étudiant existe déjà")
    @PreAuthorize("hasAnyRole('ADMIN', 'SCOLARITE')")
    @PostMapping("/students")
    public ResponseEntity<String> createStudent(@RequestBody StudentRequestDto dto) {
        String result = adminService.createStudent(dto, "STUDENT");
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @Operation(summary = "Lister tous les étudiants", description = "Retourne la liste complète des étudiants enregistrés.")
    @PreAuthorize("hasAnyRole('ADMIN', 'SCOLARITE', 'CHEF_DEPT', 'RESP_PEDAGO')")
    @GetMapping("/students")
    public ResponseEntity<List<Student>> getAllStudents() {
        List<Student> students = adminService.getAllStudents();
        return new ResponseEntity<>(students, HttpStatus.OK);
    }

    @Operation(summary = "Créer un enseignant", description = "Crée un nouveau compte enseignant avec ses informations professionnelles.")
    @ApiResponse(responseCode = "201", description = "Enseignant créé avec succès")
    @ApiResponse(responseCode = "409", description = "Conflit — l'enseignant existe déjà")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/lecturers")
    public ResponseEntity<String> createLecturer(@RequestBody LecturerRequestDto dto) {
        String result = adminService.createLecturer(dto, "LECTURER");
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @Operation(summary = "Lister tous les enseignants", description = "Retourne la liste complète des enseignants enregistrés.")
    @PreAuthorize("hasAnyRole('ADMIN', 'SCOLARITE', 'CHEF_DEPT', 'RESP_PEDAGO')")
    @GetMapping("/lecturers")
    public ResponseEntity<List<Lecturer>> getAllLecturers() {
        List<Lecturer> lecturers = adminService.getAllLecturers();
        return new ResponseEntity<>(lecturers, HttpStatus.OK);
    }

    @Operation(summary = "Rechercher un utilisateur par username", description = "Retourne les informations de base (email, nom) d'un utilisateur à partir de son nom d'utilisateur.")
    @PreAuthorize("hasAnyRole('ADMIN', 'SCOLARITE', 'CHEF_DEPT', 'RESP_PEDAGO')")
    @GetMapping("/users/username/{username:.+}")
    public ResponseEntity<Map<String, String>> getUserByUsername(
            @Parameter(description = "Nom d'utilisateur unique") @PathVariable String username) {
        Map<String, String> user = adminService.getUserByUsername(username);
        return new ResponseEntity<>(user, HttpStatus.OK);
    }

    @Operation(summary = "Changer le département d'un étudiant", description = "Met à jour le département d'affectation d'un étudiant identifié par son username.")
    @PreAuthorize("hasAnyRole('ADMIN', 'SCOLARITE', 'CHEF_DEPT')")
    @PutMapping("/students/username/{username:.+}/department")
    public ResponseEntity<String> updateStudentDepartment(
            @Parameter(description = "Username de l'étudiant") @PathVariable String username,
            @Parameter(description = "Nouveau département") @RequestParam String department) {
        adminService.updateStudentDepartment(username, department);
        return new ResponseEntity<>("Department updated", HttpStatus.OK);
    }

    @Operation(summary = "Supprimer un étudiant", description = "Supprime un étudiant identifié par son username.")
    @ApiResponse(responseCode = "200", description = "Étudiant supprimé avec succès")
    @ApiResponse(responseCode = "404", description = "Étudiant non trouvé")
    @PreAuthorize("hasAnyRole('ADMIN', 'SCOLARITE')")
    @DeleteMapping("/students/username/{username:.+}")
    public ResponseEntity<String> deleteStudentByUsername(@PathVariable String username) {
        Student student = adminService.getStudentByUsername(username);
        if (student != null) {
            adminService.deleteStudent(student.getId());
            return new ResponseEntity<>("Student deleted successfully", HttpStatus.OK);
        }
        return new ResponseEntity<>("Student not found", HttpStatus.NOT_FOUND);
    }

    @Operation(summary = "Supprimer un enseignant", description = "Supprime un enseignant identifié par son username.")
    @ApiResponse(responseCode = "200", description = "Enseignant supprimé avec succès")
    @ApiResponse(responseCode = "404", description = "Enseignant non trouvé")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/lecturers/username/{username:.+}")
    public ResponseEntity<String> deleteLecturerByUsername(@PathVariable String username) {
        Lecturer lecturer = adminService.getLecturerByUsername(username);
        if (lecturer != null) {
            adminService.deleteLecturer(lecturer.getId());
            return new ResponseEntity<>("Lecturer deleted successfully", HttpStatus.OK);
        }
        return new ResponseEntity<>("Lecturer not found", HttpStatus.NOT_FOUND);
    }

}
