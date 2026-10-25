package com.lms.university.controller;

import com.lms.university.dto.TimetableDto;
import com.lms.university.service.TimetableService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/uni/timetables")
@RequiredArgsConstructor
@Tag(name = "Timetables", description = "Gestion des emplois du temps")
public class TimetableController {

    private final TimetableService timetableService;

    @Operation(summary = "Créer un emploi du temps")
    @PostMapping
    public ResponseEntity<TimetableDto> createTimetable(@RequestBody TimetableDto timetableDto) {
        return ResponseEntity.ok(timetableService.createTimetable(timetableDto));
    }

    @Operation(summary = "Mettre à jour un emploi du temps")
    @PutMapping("/{id}")
    public ResponseEntity<TimetableDto> updateTimetable(@PathVariable Long id, @RequestBody TimetableDto timetableDto) {
        return ResponseEntity.ok(timetableService.updateTimetable(id, timetableDto));
    }

    @Operation(summary = "Supprimer un emploi du temps")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTimetable(@PathVariable Long id) {
        timetableService.deleteTimetable(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Obtenir un emploi du temps par ID")
    @GetMapping("/{id}")
    public ResponseEntity<TimetableDto> getTimetable(@PathVariable Long id) {
        return ResponseEntity.ok(timetableService.getTimetable(id));
    }

    @Operation(summary = "Lister les emplois du temps d'une classe")
    @GetMapping("/class/{classId}")
    public ResponseEntity<List<TimetableDto>> getTimetablesByClass(@PathVariable String classId) {
        return ResponseEntity.ok(timetableService.getTimetablesByClass(classId));
    }

    @Operation(summary = "Obtenir le dernier emploi du temps publié d'une classe")
    @GetMapping("/class/{classId}/latest")
    public ResponseEntity<TimetableDto> getLatestPublishedTimetable(@PathVariable String classId) {
        return ResponseEntity.ok(timetableService.getLatestPublishedTimetable(classId));
    }

    @Operation(summary = "Publier un emploi du temps")
    @PostMapping("/{id}/publish")
    public ResponseEntity<TimetableDto> publishTimetable(@PathVariable Long id) {
        return ResponseEntity.ok(timetableService.publishTimetable(id));
    }
}
