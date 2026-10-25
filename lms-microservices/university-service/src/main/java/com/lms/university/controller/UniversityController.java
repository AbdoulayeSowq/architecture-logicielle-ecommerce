package com.lms.university.controller;

import com.lms.university.dto.*;
import com.lms.university.entity.*;
import com.lms.university.exception.ConflictException;
import com.lms.university.exception.NotFoundException;
import com.lms.university.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/api/uni")
@Tag(name = "Cycles, Departments & Classes", description = "Gestion des cycles, départements et classes")
public class UniversityController {

    private final CycleService cycleService;
    private final DepartmentService departmentService;
    private final ClassService classService;
    private final KafkaProducerService kafkaProducerService;

    // ---------------- Cycle ----------------

    @Operation(summary = "Lister tous les cycles", description = "Retourne la liste complète des cycles (Tronc Commun, Cycle Ingénieur).")
    @GetMapping("/cycle")
    public ResponseEntity<?> listCycles() {
        try {
            List<Cycle> cycles = cycleService.listCycles();
            return new ResponseEntity<>(cycles, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to list cycles", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Obtenir un cycle", description = "Retourne les détails d'un cycle spécifique.")
    @GetMapping("/cycle/{id}")
    public ResponseEntity<?> getCycle(@PathVariable(name = "id") Long id) {
        try {
            Cycle cycle = cycleService.getCycleById(id);
            return new ResponseEntity<>(cycle, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get cycle", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Créer un cycle", description = "Crée un nouveau cycle.")
    @PostMapping("/cycle")
    public ResponseEntity<?> createCycle(@RequestBody Cycle cycle) {
        try {
            Cycle newCycle = cycleService.createCycle(cycle);
            return new ResponseEntity<>(newCycle, HttpStatus.CREATED);
        } catch (ConflictException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to create cycle", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Mettre à jour un cycle", description = "Met à jour un cycle existant.")
    @PutMapping("/cycle/{id}/update")
    public ResponseEntity<?> updateCycle(@RequestBody CycleUpdateDto cycleUpdateDto, @PathVariable(name = "id") Long id) {
        try {
            Cycle updatedCycle = cycleService.updateCycle(id, cycleUpdateDto);
            return new ResponseEntity<>(updatedCycle, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update cycle", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Supprimer un cycle", description = "Supprime un cycle par son ID.")
    @DeleteMapping("/cycle/{id}/delete")
    public ResponseEntity<String> deleteCycle(@PathVariable(name = "id") Long id) {
        try {
            String response = cycleService.deleteCycle(id);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete cycle", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Départements d'un cycle", description = "Liste les départements d'un cycle.")
    @GetMapping("/cycle/{id}/departments")
    public ResponseEntity<?> listDepartmentsByCycleId(@PathVariable(name = "id") Long id) {
        try {
            List<Department> departments = cycleService.getDepartmentsByCycleId(id);
            return new ResponseEntity<>(departments, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to list departments", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Assigner un département à un cycle", description = "Associe un département à un cycle.")
    @PostMapping("/cycle/{cycleId}/department/{departmentId}")
    public ResponseEntity<?> assignDepartmentToCycle(@PathVariable(name = "cycleId") Long cycleId, @PathVariable(name = "departmentId") Long departmentId) {
        try {
            String response = cycleService.assignDepartmentToCycle(cycleId, departmentId);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to assign department to cycle", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Désassigner un département d'un cycle", description = "Retire l'assignation d'un département.")
    @DeleteMapping("/department/{departmentId}/unassign")
    public ResponseEntity<?> unassignDepartmentFromCycle(@PathVariable(name = "departmentId") Long departmentId) {
        try {
            String response = cycleService.unassignDepartmentFromCycle(departmentId);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to unassign department from cycle", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Départements sans cycle", description = "Liste les départements non assignés à un cycle.")
    @GetMapping("/department/unassigned")
    public ResponseEntity<?> listDepartmentWithoutCycle() {
        try {
            List<Department> departments = departmentService.listDepartmentWithoutCycle();
            return new ResponseEntity<>(departments, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to list departments", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ---------------- Department ----------------

    @Operation(summary = "Lister tous les départements", description = "Retourne la liste complète des départements.")
    @GetMapping("/department")
    public ResponseEntity<?> listDepartments() {
        try {
            List<Department> departments = departmentService.getDepartments();
            return new ResponseEntity<>(departments, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to list departments", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Obtenir un département", description = "Retourne les détails d'un département.")
    @GetMapping("/department/{id}")
    public ResponseEntity<?> getDepartment(@PathVariable(name = "id") Long id) {
        try {
            Department department = departmentService.getDepartmentById(id);
            return new ResponseEntity<>(department, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get department", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Créer un département", description = "Crée un nouveau département.")
    @PostMapping("/department")
    public ResponseEntity<?> createDepartment(@RequestBody Department department) {
        try {
            Department newDepartment = departmentService.createDepartment(department);
            return new ResponseEntity<>(newDepartment, HttpStatus.CREATED);
        } catch (ConflictException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to create department", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Mettre à jour un département", description = "Met à jour un département existant.")
    @PutMapping("/department/{id}/update")
    public ResponseEntity<?> updateDepartment(@RequestBody DepartmentUpdateDto departmentUpdateDto, @PathVariable(name = "id") Long id) {
        try {
            Department updatedDepartment = departmentService.updateDepartment(id, departmentUpdateDto);
            return new ResponseEntity<>(updatedDepartment, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update department", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Supprimer un département", description = "Supprime un département par son ID.")
    @DeleteMapping("/department/{id}/delete")
    public ResponseEntity<String> deleteDepartment(@PathVariable(name = "id") Long id) {
        try {
            String response = departmentService.deleteDepartment(id);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete department", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Assigner un cours à un département", description = "Associe un cours à un département.")
    @PostMapping("/department/{departmentId}/course/{courseId}")
    public ResponseEntity<?> assignCourseToDepartment(@PathVariable(name = "departmentId") Long departmentId, @PathVariable(name = "courseId") Long courseId) {
        try {
            String response = departmentService.assignCourseToDepartment(departmentId, courseId);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (ConflictException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to assign course to department", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Désassigner un cours d'un département", description = "Retire l'assignation d'un cours.")
    @DeleteMapping("/department/{departmentId}/course/{courseId}")
    public ResponseEntity<?> unassignCourseFromDepartment(@PathVariable(name = "departmentId") Long departmentId, @PathVariable(name = "courseId") Long courseId) {
        try {
            String response = departmentService.unassignCourseFromDepartment(departmentId, courseId);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to unassign course from department", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ---------------- Class ----------------

    @Operation(summary = "Lister toutes les classes", description = "Retourne la liste complète des classes.")
    @GetMapping("/class")
    public ResponseEntity<?> listClasses() {
        try {
            List<com.lms.university.entity.Class> classes = classService.listClasses();
            return new ResponseEntity<>(classes, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to list classes", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Obtenir une classe", description = "Retourne les détails d'une classe.")
    @GetMapping("/class/{id}")
    public ResponseEntity<?> getClass(@PathVariable(name = "id") Long id) {
        try {
            com.lms.university.entity.Class classRef = classService.getClassById(id);
            return new ResponseEntity<>(classRef, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get class", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Créer une classe", description = "Crée une nouvelle classe.")
    @PostMapping("/class")
    public ResponseEntity<?> createClass(@RequestBody com.lms.university.entity.Class classRef) {
        try {
            com.lms.university.entity.Class newClass = classService.createClass(classRef);
            return new ResponseEntity<>(newClass, HttpStatus.CREATED);
        } catch (ConflictException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to create class", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Mettre à jour une classe", description = "Met à jour une classe existante.")
    @PutMapping("/class/{id}/update")
    public ResponseEntity<?> updateClass(@RequestBody ClassUpdateDto classUpdateDto, @PathVariable(name = "id") Long id) {
        try {
            com.lms.university.entity.Class updatedClass = classService.updateClass(id, classUpdateDto);
            return new ResponseEntity<>(updatedClass, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update class", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Supprimer une classe", description = "Supprime une classe par son ID.")
    @DeleteMapping("/class/{id}/delete")
    public ResponseEntity<String> deleteClass(@PathVariable(name = "id") Long id) {
        try {
            String response = classService.deleteClass(id);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete class", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Classes d'un département", description = "Liste les classes d'un département.")
    @GetMapping("/department/{id}/classes")
    public ResponseEntity<?> listClassesByDepartmentId(@PathVariable(name = "id") Long id) {
        try {
            List<com.lms.university.entity.Class> classes = classService.getClassesByDepartmentId(id);
            return new ResponseEntity<>(classes, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to list classes", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Assigner une classe à un département", description = "Associe une classe à un département.")
    @PostMapping("/department/{departmentId}/class/{classId}")
    public ResponseEntity<?> assignClassToDepartment(@PathVariable(name = "departmentId") Long departmentId, @PathVariable(name = "classId") Long classId) {
        try {
            String response = classService.assignClassToDepartment(departmentId, classId);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to assign class to department", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Classes sans département", description = "Liste les classes non assignées (TC1).")
    @GetMapping("/class/unassigned")
    public ResponseEntity<?> listClassesWithoutDepartment() {
        try {
            List<com.lms.university.entity.Class> classes = classService.listClassesWithoutDepartment();
            return new ResponseEntity<>(classes, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to list classes", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Désassigner une classe d'un département", description = "Retire l'assignation d'une classe.")
    @DeleteMapping("/class/{classId}/unassign")
    public ResponseEntity<?> unassignClassFromDepartment(@PathVariable(name = "classId") Long classId) {
        try {
            String response = classService.unassignClassFromDepartment(classId);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to unassign class from department", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @Operation(summary = "Synchroniser tout via Kafka", description = "Renvoie tous les départements et classes sur le bus Kafka.")
    @PostMapping("/sync-all")
    public ResponseEntity<String> syncAll() {
        try {
            departmentService.getDepartments().forEach(d -> 
                kafkaProducerService.sendEvent(UniversityEvent.builder()
                    .action("SYNC")
                    .type("DEPT")
                    .id(d.getId())
                    .name(d.getName())
                    .code(d.getDId())
                    .build())
            );
            
            classService.listClasses().forEach(c -> 
                kafkaProducerService.sendEvent(UniversityEvent.builder()
                    .action("SYNC")
                    .type("CLASS")
                    .id(c.getId())
                    .name(c.getName())
                    .code(c.getClid())
                    .build())
            );
            
            return ResponseEntity.ok("Synchronization events sent to Kafka");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Sync failed: " + e.getMessage());
        }
    }
}
