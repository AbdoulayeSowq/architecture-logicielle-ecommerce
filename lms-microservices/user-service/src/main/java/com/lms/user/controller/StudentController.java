package com.lms.user.controller;

import com.lms.user.entity.Student;
import com.lms.user.exception.NotFoundException;
import com.lms.user.service.AdminService;
import com.lms.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/user/student")
@RequiredArgsConstructor
@Tag(name = "Étudiants", description = "Opérations pour le profil étudiant")
public class StudentController {

    private final UserService userService;
    private final AdminService adminService;

    @Operation(summary = "Obtenir le profil d'un étudiant", description = "Retourne les informations complètes d'un étudiant à partir de son username.")
    @GetMapping("/{username:.+}/username")
    public ResponseEntity<Student> getStudentByUsername(@PathVariable String username) {
        try {
            Student student = adminService.getStudentByUsername(username);
            return new ResponseEntity<>(student, HttpStatus.OK);
        } catch (Exception e) {
            throw new NotFoundException("Student not found");
        }
    }

    @Operation(summary = "Obtenir les étudiants par niveau", description = "Retourne la liste des étudiants d'un niveau donné (ex: DIC1, DIC2).")
    @GetMapping("/level/{level:.+}")
    public ResponseEntity<List<Student>> getStudentsByLevel(@PathVariable String level) {
        try {
            List<Student> students = adminService.getStudentsByLevel(level);
            return new ResponseEntity<>(students, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
