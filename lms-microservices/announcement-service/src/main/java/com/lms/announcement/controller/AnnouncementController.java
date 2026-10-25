package com.lms.announcement.controller;

import com.lms.announcement.dto.AssignmentDto;
import com.lms.announcement.entity.Announcement;
import com.lms.announcement.dto.EventDto;
import com.lms.announcement.dto.ExamDto;
import com.lms.announcement.dto.MaintenanceDto;
import com.lms.announcement.exception.InvalidDateException;
import com.lms.announcement.exception.NotFoundException;
import com.lms.announcement.services.AnnouncementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/announcement")
@AllArgsConstructor
@Tag(name = "Annonces", description = "Gestion des annonces : devoirs, événements, examens et maintenance")
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final SimpMessagingTemplate messagingTemplate;

    @Operation(summary = "Lister toutes les annonces", description = "Retourne la liste de toutes les annonces (devoirs, événements, examens, maintenance).")
    @GetMapping("/all")
    public ResponseEntity<?> getAnnouncements() {
        try {
            return ResponseEntity.ok(announcementService.listAllAnnouncements());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to get announcements");
        }
    }

    @Operation(summary = "Filtrer les annonces par type", description = "Retourne les annonces filtrées par type (assignment, event, exam, maintenance).")
    @GetMapping("/type/{type}")
    public ResponseEntity<?> getAnnouncementsByType(@PathVariable String type) {
        try {
            return ResponseEntity.ok(announcementService.listByType(type));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to get announcements by type");
        }
    }

    @Operation(summary = "Filtrer par audience",
               description = "Retourne les annonces selon l'audience cible : ALL, STUDENTS, LECTURERS, COURSE, CLASS.")
    @GetMapping("/audience/{audience}")
    public ResponseEntity<?> getByAudience(@PathVariable String audience) {
        try {
            return ResponseEntity.ok(announcementService.listByAudience(audience));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to get announcements by audience");
        }
    }

    @Operation(summary = "Annonces d'un cours",
               description = "Retourne les annonces ciblant un cours précis (targetAudience = COURSE).")
    @GetMapping("/course/{courseCode}")
    public ResponseEntity<?> getByCourse(@PathVariable String courseCode) {
        try {
            return ResponseEntity.ok(announcementService.listByCourse(courseCode));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to get announcements for course");
        }
    }

    @Operation(summary = "Annonces d'une classe",
               description = "Retourne les annonces ciblant une classe précise (targetAudience = CLASS).")
    @GetMapping("/class/{classId}")
    public ResponseEntity<?> getByClass(@PathVariable String classId) {
        try {
            return ResponseEntity.ok(announcementService.listByClass(classId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to get announcements for class");
        }
    }

    @Operation(summary = "Annonces visibles par un étudiant",
               description = "Retourne toutes les annonces visibles pour un étudiant : ALL + STUDENTS + ses cours + ses classes. " +
                             "Paramètres : courseCodes (codes des cours), classIds (identifiants des classes).")
    @GetMapping("/for/student")
    public ResponseEntity<?> getForStudent(
            @RequestParam(required = false) List<String> courseCodes,
            @RequestParam(required = false) List<String> classIds) {
        try {
            return ResponseEntity.ok(announcementService.listForStudent(courseCodes, classIds));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to get announcements for student");
        }
    }

    @Operation(summary = "Annonces visibles par un enseignant",
               description = "Retourne toutes les annonces visibles pour les enseignants, filtrées sur leur périmètre d'action.")
    @GetMapping("/for/lecturer")
    public ResponseEntity<?> getForLecturer(
            @RequestParam(required = false) List<String> classIds,
            @RequestParam(required = false) List<String> courseCodes,
            @RequestParam(required = false) String username) {
        try {
            return ResponseEntity.ok(announcementService.listForLecturer(classIds, courseCodes, username));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to get announcements for lecturers");
        }
    }



    @Operation(summary = "Créer une annonce de devoir", description = "Publie une nouvelle annonce de type devoir avec date limite.")
    @PostMapping("/assignment")
    public ResponseEntity<?> createAssignment(@RequestBody AssignmentDto assignmentDto) {
        try {
            Announcement saved = announcementService.createAssignment(assignmentDto);
            messagingTemplate.convertAndSend("/topic/announcements", saved);
            return ResponseEntity.ok(saved);
        } catch (InvalidDateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to create announcement");
        }
    }

    @Operation(summary = "Créer une annonce d'événement", description = "Publie une nouvelle annonce de type événement.")
    @PostMapping("/event")
    public ResponseEntity<?> createEvent(@RequestBody EventDto eventDto) {
        try {
            Announcement saved = announcementService.createEvent(eventDto);
            messagingTemplate.convertAndSend("/topic/announcements", saved);
            return ResponseEntity.ok(saved);
        } catch (InvalidDateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to create announcement");
        }
    }

    @Operation(summary = "Créer une annonce d'examen", description = "Publie une nouvelle annonce de type examen.")
    @PostMapping("/exam")
    public ResponseEntity<?> createExam(@RequestBody ExamDto examDto) {
        try {
            Announcement saved = announcementService.createExam(examDto);
            messagingTemplate.convertAndSend("/topic/announcements", saved);
            return ResponseEntity.ok(saved);
        } catch (InvalidDateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to create announcement");
        }
    }

    @Operation(summary = "Créer une annonce de maintenance", description = "Publie une annonce de maintenance système.")
    @PostMapping("/maintenance")
    public ResponseEntity<?> createMaintenance(@RequestBody MaintenanceDto maintenanceDto) {
        try {
            Announcement saved = announcementService.createMaintenance(maintenanceDto);
            messagingTemplate.convertAndSend("/topic/announcements", saved);
            return ResponseEntity.ok(saved);
        } catch (InvalidDateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to create announcement");
        }
    }

    @Operation(summary = "Supprimer une annonce", description = "Supprime une annonce par son ID.")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(announcementService.deleteAnnouncement(id));
        } catch (NotFoundException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to delete announcement");
        }
    }

    @Operation(summary = "Mettre à jour une annonce de devoir", description = "Met à jour une annonce de type devoir.")
    @PutMapping("/assignment/{id}")
    public ResponseEntity<?> updateAssignment(@PathVariable Long id, @RequestBody AssignmentDto assignmentDto) {
        try {
            return ResponseEntity.ok(announcementService.updateAssignment(id, assignmentDto));
        } catch (NotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (InvalidDateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to update assignment");
        }
    }

    @Operation(summary = "Mettre à jour une annonce d'événement", description = "Met à jour une annonce de type événement.")
    @PutMapping("/event/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody EventDto eventDto) {
        try {
            return ResponseEntity.ok(announcementService.updateEvent(id, eventDto));
        } catch (NotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (InvalidDateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to update event");
        }
    }

    @Operation(summary = "Mettre à jour une annonce d'examen", description = "Met à jour une annonce de type examen.")
    @PutMapping("/exam/{id}")
    public ResponseEntity<?> updateExam(@PathVariable Long id, @RequestBody ExamDto examDto) {
        try {
            return ResponseEntity.ok(announcementService.updateExam(id, examDto));
        } catch (NotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (InvalidDateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to update exam");
        }
    }

    @Operation(summary = "Mettre à jour une annonce de maintenance", description = "Met à jour une annonce de maintenance.")
    @PutMapping("/maintenance/{id}")
    public ResponseEntity<?> updateMaintenance(@PathVariable Long id, @RequestBody MaintenanceDto maintenanceDto) {
        try {
            return ResponseEntity.ok(announcementService.updateMaintenance(id, maintenanceDto));
        } catch (NotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (InvalidDateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to update maintenance");
        }
    }
}
