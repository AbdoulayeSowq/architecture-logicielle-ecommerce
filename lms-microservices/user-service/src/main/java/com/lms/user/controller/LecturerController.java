package com.lms.user.controller;

import com.lms.user.entity.Lecturer;
import com.lms.user.exception.NotFoundException;
import com.lms.user.service.AdminService;
import com.lms.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@AllArgsConstructor
@RequestMapping(value = "/api/user/lecturer")
@Tag(name = "Enseignants", description = "Opérations pour le profil enseignant")
public class LecturerController {

    private final UserService userService;
    private final AdminService adminService;

    @Operation(summary = "Obtenir le profil d'un enseignant", description = "Retourne les informations complètes d'un enseignant à partir de son username.")
    @GetMapping("/{username:.+}/username")
    public ResponseEntity<Lecturer> getLecturerByUsername(@PathVariable String username) {
        try {
            Lecturer lecturer = adminService.getLecturerByUsername(username);
            return new ResponseEntity<>(lecturer, HttpStatus.OK);
        } catch (Exception e) {
            throw new NotFoundException("Lecturer not found");
        }
    }

    @Operation(summary = "Assigner une classe à un Responsable Pédagogique", description = "Met à jour le supervisedClassName d'un enseignant pour le désigner comme Responsable Pédagogique d'une classe.")
    @PreAuthorize("hasAnyRole('ADMIN', 'CHEF_DEPT')")
    @PutMapping("/{username:.+}/supervised-class")
    public ResponseEntity<String> updateSupervisedClass(@PathVariable String username, @RequestBody java.util.Map<String, String> request) {
        try {
            String supervisedClassName = request.get("supervisedClassName");
            Lecturer lecturer = adminService.getLecturerByUsername(username);
            lecturer.setSupervisedClassName(supervisedClassName);
            adminService.updateLecturer(lecturer);
            return new ResponseEntity<>("Responsable Pédagogique assigné avec succès", HttpStatus.OK);
        } catch (Exception e) {
            throw new NotFoundException("Erreur lors de l'assignation: " + e.getMessage());
        }
    }

}
