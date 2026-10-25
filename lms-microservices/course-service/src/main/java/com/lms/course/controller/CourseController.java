package com.lms.course.controller;

import com.lms.course.dto.CourseUpdateDto;
import com.lms.course.dto.ModuleUpdateDto;
import com.lms.course.entity.Course;
import com.lms.course.entity.CModule;
import com.lms.course.exception.ConflictException;
import com.lms.course.exception.NotFoundException;
import com.lms.course.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/course")
@Tag(name = "Séances & Modules", description = "Gestion des séances, modules/EC, matériels, notes, quiz et forums")
public class CourseController {
    private final CourseService courseService;
    private final com.lms.course.repository.QuizResultRepository quizResultRepository;

    public CourseController(CourseService courseService,
                            com.lms.course.repository.QuizResultRepository quizResultRepository) {
        this.courseService = courseService;
        this.quizResultRepository = quizResultRepository;
    }

    // ======================== SÉANCES ========================

    @Operation(summary = "Lister toutes les séances", description = "Retourne la liste complète des séances disponibles.")
    @GetMapping
    public ResponseEntity<?> getAllCourses() {
        try {
            List<Course> courses = courseService.getAllCourses();
            return new ResponseEntity<>(courses, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to retrieve courses", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Obtenir le nom d'un cours", description = "Retourne uniquement le nom d'un cours par son ID.")
    @GetMapping("/name/{courseId}")
    public ResponseEntity<?> getCourseNameById(@PathVariable Long courseId) {
        try {
            String courseName = courseService.getCourseNameById(courseId);
            return new ResponseEntity<>(courseName, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get course name", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Obtenir un cours par ID", description = "Retourne les détails complets d'un cours.")
    @GetMapping("/{id}")
    public ResponseEntity<?> getCourseById(@PathVariable Long id) {
        try {
            Course course = courseService.getCourseById(id);
            return new ResponseEntity<>(course, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get course", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Créer un cours", description = "Crée un nouveau cours dans le système.")
    @PostMapping
    public ResponseEntity<?> createCourse(@RequestBody Course course) {
        try {
            Course createdCourse = courseService.createCourse(course);
            return new ResponseEntity<>(createdCourse, HttpStatus.CREATED);
        } catch (ConflictException e){
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to create course", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Mettre à jour un cours", description = "Met à jour les informations d'un cours existant.")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourse(@PathVariable Long id, @RequestBody CourseUpdateDto courseDetails) {
        try {
            return new ResponseEntity<>(courseService.updateCourse(id, courseDetails), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update course", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Supprimer un cours", description = "Supprime un cours par son ID.")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(courseService.deleteCourse(id), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete course", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ======================== MODULES ========================

    @Operation(summary = "Lister tous les modules", description = "Retourne la liste complète des modules pédagogiques.")
    @GetMapping("/module")
    public ResponseEntity<?> getAllModules() {
        try {
            List<CModule> CModules = courseService.getModules();
            return new ResponseEntity<>(CModules, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to retrieve modules", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Modules par enseignant", description = "Retourne les modules assignés à un enseignant identifié par son username.")
    @GetMapping("/module/lecturer/{username:.+}")
    public ResponseEntity<?> getModulesByLecturer(@PathVariable String username) {
        try {
            List<CModule> modules = courseService.getModulesByLecturer(username);
            return new ResponseEntity<>(modules, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get modules for lecturer", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Obtenir un module par ID", description = "Retourne les détails complets d'un module.")
    @GetMapping("/module/{id}")
    public ResponseEntity<?> getModuleById(@PathVariable Long id) {
        try {
            CModule module = courseService.getModuleById(id);
            return new ResponseEntity<>(module, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get module", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Obtenir un module par code EC", description = "Retourne les détails d'un module via son code EC (ex: DEV15011).")
    @GetMapping("/module/code/{codeEC}")
    public ResponseEntity<?> getModuleByCodeEC(@PathVariable String codeEC) {
        try {
            CModule module = courseService.getModuleByCodeEC(codeEC);
            return new ResponseEntity<>(module, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get module", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Modules par semestre", description = "Retourne les modules d'un semestre (S5, S6).")
    @GetMapping("/module/semester/{semester:.+}")
    public ResponseEntity<?> getModulesBySemester(@PathVariable String semester) {
        try {
            List<CModule> modules = courseService.getModulesBySemester(semester);
            return new ResponseEntity<>(modules, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get modules", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Modules par niveau", description = "Retourne les modules d'un niveau (DIC1, DIC2, DIC3).")
    @GetMapping("/module/level/{level:.+}")
    public ResponseEntity<?> getModulesByLevel(@PathVariable String level) {
        try {
            List<CModule> modules = courseService.getModulesByLevel(level);
            return new ResponseEntity<>(modules, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get modules", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Modules par UE", description = "Retourne les modules d'une Unité d'Enseignement.")
    @GetMapping("/module/teaching-unit/{teachingUnitId}")
    public ResponseEntity<?> getModulesByTeachingUnit(@PathVariable Long teachingUnitId) {
        try {
            List<CModule> modules = courseService.getModulesByTeachingUnit(teachingUnitId);
            return new ResponseEntity<>(modules, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get modules", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Créer un module", description = "Crée un nouveau module pédagogique. Nécessite une TeachingUnit (UE) parente.")
    @PostMapping("/module")
    public ResponseEntity<?> createModule(@RequestBody CModule module) {
        try {
            CModule createdModule = courseService.createModule(module);
            return new ResponseEntity<>(createdModule, HttpStatus.CREATED);
        } catch (ConflictException e){
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to create module: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Mettre à jour un module", description = "Met à jour les informations d'un module existant.")
    @PutMapping("/module/{id}")
    public ResponseEntity<?> updateModule(@PathVariable Long id, @RequestBody ModuleUpdateDto moduleUpdateDto) {
        try {
            return new ResponseEntity<>(courseService.updateModule(id, moduleUpdateDto), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update module", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Supprimer un module", description = "Supprime un module par son ID.")
    @DeleteMapping("/module/{id}")
    public ResponseEntity<?> deleteModule(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(courseService.deleteModule(id), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete module", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Cours par module", description = "Retourne la liste des cours assignés à un module.")
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

    @Operation(summary = "Cours non assignés", description = "Retourne les cours qui ne sont assignés à aucun département.")
    @GetMapping("/unassigned")
    public ResponseEntity<?> getCoursesWithoutAssigned() {
        try {
            List<Course> courses = courseService.getCoursesWithoutAssigned();
            return new ResponseEntity<>(courses, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get courses", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Cours par département", description = "Retourne les cours assignés à un département spécifique.")
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<?> getCoursesByDepartmentId(@PathVariable Long departmentId) {
        try {
            List<Course> courses = courseService.getCoursesByDepartmentId(departmentId);
            return new ResponseEntity<>(courses, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get courses", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Modules par département", description = "Retourne les modules (EC) assignés à un département spécifique.")
    @GetMapping("/module/department/{departmentId}")
    public ResponseEntity<?> getModulesByDepartmentId(@PathVariable Long departmentId) {
        try {
            List<CModule> modules = courseService.getModulesByDepartmentId(departmentId);
            return new ResponseEntity<>(modules, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get modules", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Désassigner un cours d'un département", description = "Retire l'assignation d'un cours à son département.")
    @DeleteMapping("/unassign/{courseId}/department")
    public ResponseEntity<?> unassignCourseFromDepartment(@PathVariable Long courseId) {
        try {
            return new ResponseEntity<>(courseService.unassignCourseFromDepartment(courseId), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to unassign course from department", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ======================== COURSE SESSIONS (SÉANCES) ========================

    @Operation(summary = "Séances d'un module", description = "Retourne toutes les séances d'un module, triées par ordre.")
    @GetMapping("/module/{moduleId}/sessions")
    public ResponseEntity<?> getCourseSessionsByModuleId(@PathVariable Long moduleId) {
        try {
            List<Course> sessions = courseService.getCourseSessionsByModuleId(moduleId);
            return new ResponseEntity<>(sessions, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get sessions", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Détails d'une séance", description = "Retourne les détails d'une séance spécifique.")
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<?> getCourseSessionById(@PathVariable Long sessionId) {
        try {
            Course session = courseService.getCourseSessionById(sessionId);
            return new ResponseEntity<>(session, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get session", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Créer une séance", description = "Crée une nouvelle séance dans un module. Nécessite d'être le prof du module.")
    @PostMapping("/module/{moduleId}/session")
    public ResponseEntity<?> createCourseSession(
            @PathVariable Long moduleId,
            @RequestBody com.lms.course.dto.CourseSessionDto sessionDto,
            @RequestHeader(value = "X-User-Username", required = false) String lecturerUsername) {
        try {
            // Pour l'instant, on utilise un header X-User-Username pour simuler l'auth
            // En production, on extraira le username depuis le JWT token
            if (lecturerUsername == null) {
                lecturerUsername = "default_lecturer"; // À remplacer par extraction JWT
            }
            Course session = courseService.createCourseSession(moduleId, sessionDto, lecturerUsername);
            return new ResponseEntity<>(session, HttpStatus.CREATED);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (SecurityException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to create session: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Mettre à jour une séance", description = "Met à jour une séance existante. Nécessite d'être le prof du module.")
    @PutMapping("/session/{sessionId}")
    public ResponseEntity<?> updateCourseSession(
            @PathVariable Long sessionId,
            @RequestBody com.lms.course.dto.CourseSessionDto sessionDto,
            @RequestHeader(value = "X-User-Username", required = false) String lecturerUsername) {
        try {
            if (lecturerUsername == null) {
                lecturerUsername = "default_lecturer";
            }
            Course session = courseService.updateCourseSession(sessionId, sessionDto, lecturerUsername);
            return new ResponseEntity<>(session, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (SecurityException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update session: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Supprimer une séance", description = "Supprime une séance. Nécessite d'être le prof du module.")
    @DeleteMapping("/session/{sessionId}")
    public ResponseEntity<?> deleteCourseSession(
            @PathVariable Long sessionId,
            @RequestHeader(value = "X-User-Username", required = false) String lecturerUsername) {
        try {
            if (lecturerUsername == null) {
                lecturerUsername = "default_lecturer";
            }
            String result = courseService.deleteCourseSession(sessionId, lecturerUsername);
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (SecurityException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete session", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ======================== UNITÉS D'ENSEIGNEMENT (UE) ========================

    @Operation(summary = "Lister toutes les UE", description = "Retourne la liste complète des Unités d'Enseignement.")
    @GetMapping("/teaching-unit")
    public ResponseEntity<?> getAllTeachingUnits() {
        try {
            return new ResponseEntity<>(courseService.getAllTeachingUnits(), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get teaching units", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Obtenir une UE par ID", description = "Retourne les détails d'une Unité d'Enseignement.")
    @GetMapping("/teaching-unit/{id}")
    public ResponseEntity<?> getTeachingUnitById(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(courseService.getTeachingUnitById(id), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get teaching unit", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Obtenir une UE par code", description = "Retourne une UE via son code (ex: DEV1501).")
    @GetMapping("/teaching-unit/code/{code}")
    public ResponseEntity<?> getTeachingUnitByCode(@PathVariable String code) {
        try {
            return new ResponseEntity<>(courseService.getTeachingUnitByCode(code), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get teaching unit", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "UE par semestre", description = "Retourne les UE d'un semestre (S5, S6).")
    @GetMapping("/teaching-unit/semester/{semester}")
    public ResponseEntity<?> getTeachingUnitsBySemester(@PathVariable String semester) {
        try {
            return new ResponseEntity<>(courseService.getTeachingUnitsBySemester(semester), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get teaching units", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "UE par classe", description = "Retourne les UE assignées à une classe.")
    @GetMapping("/teaching-unit/class/{classId}")
    public ResponseEntity<?> getTeachingUnitsByClassId(@PathVariable Long classId) {
        try {
            return new ResponseEntity<>(courseService.getTeachingUnitsByClassId(classId), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get teaching units", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Créer une UE", description = "Crée une nouvelle Unité d'Enseignement.")
    @PostMapping("/teaching-unit")
    public ResponseEntity<?> createTeachingUnit(@RequestBody com.lms.course.entity.TeachingUnit teachingUnit) {
        try {
            return new ResponseEntity<>(courseService.createTeachingUnit(teachingUnit), HttpStatus.CREATED);
        } catch (ConflictException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to create teaching unit", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Mettre à jour une UE", description = "Met à jour une Unité d'Enseignement existante.")
    @PutMapping("/teaching-unit/{id}")
    public ResponseEntity<?> updateTeachingUnit(@PathVariable Long id, @RequestBody com.lms.course.entity.TeachingUnit teachingUnit) {
        try {
            return new ResponseEntity<>(courseService.updateTeachingUnit(id, teachingUnit), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update teaching unit", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Supprimer une UE", description = "Supprime une Unité d'Enseignement par son ID.")
    @DeleteMapping("/teaching-unit/{id}")
    public ResponseEntity<?> deleteTeachingUnit(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(courseService.deleteTeachingUnit(id), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete teaching unit", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ======================== MATÉRIELS ========================

    @Operation(summary = "Matériels par module", description = "Retourne tous les supports de cours d'un module (toutes séances confondues).")
    @GetMapping("/material/module/{moduleId}")
    public ResponseEntity<?> getMaterialsByModuleId(@PathVariable Long moduleId) {
        try {
            List<com.lms.course.entity.Material> materials = courseService.getMaterialsByModuleId(moduleId);
            return new ResponseEntity<>(materials, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get materials", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Matériels par séance", description = "Retourne la liste des supports de cours d'une séance.")
    @GetMapping("/material/course/{courseId}")
    public ResponseEntity<?> getMaterialsByCourseId(@PathVariable Long courseId) {
        try {
            List<com.lms.course.entity.Material> materials = courseService.getMaterialsByCourseId(courseId);
            return new ResponseEntity<>(materials, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get materials", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Ajouter un matériel", description = "Ajoute un nouveau support de cours (PDF, lien, etc.) à un module.")
    @PostMapping("/material")
    public ResponseEntity<?> createMaterial(@RequestBody com.lms.course.dto.MaterialRequestDto dto) {
        try {
            com.lms.course.entity.Material material = courseService.createMaterial(dto);
            return new ResponseEntity<>(material, HttpStatus.CREATED);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("already exists")) {
                return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
            }
            e.printStackTrace();
            return new ResponseEntity<>("Failed to create material: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Failed to create material: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Supprimer un matériel", description = "Supprime un support de cours par son ID.")
    @DeleteMapping("/material/{id}")
    public ResponseEntity<?> deleteMaterial(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(courseService.deleteMaterial(id), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete material", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ======================== NOTES ========================

    @Operation(summary = "Notes d'un étudiant", description = "Retourne toutes les notes d'un étudiant.")
    @GetMapping("/grade/student/{studentId}")
    public ResponseEntity<?> getGradesByStudentId(@PathVariable Long studentId) {
        try {
            return new ResponseEntity<>(courseService.getGradesByStudentId(studentId), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get grades", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Notes par module", description = "Retourne toutes les notes d'un module (EC).")
    @GetMapping("/grade/module/{moduleId}")
    public ResponseEntity<?> getGradesByModuleId(@PathVariable Long moduleId) {
        try {
            return new ResponseEntity<>(courseService.getGradesByModuleId(moduleId), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get grades", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Enregistrer une note", description = "Enregistre ou met à jour une note pour un étudiant dans un module. Si une note existe déjà, elle est mise à jour.")
    @PostMapping("/grade")
    public ResponseEntity<?> saveGrade(@RequestBody com.lms.course.dto.GradeRequestDto dto) {
        try {
            return new ResponseEntity<>(courseService.saveGrade(dto), HttpStatus.CREATED);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to save grade", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Analytics de performance étudiant", description = "Retourne les statistiques de performance (moyenne, progression) pour un étudiant.")
    @GetMapping("/grade/analytics/{studentId}")
    public ResponseEntity<?> getStudentAnalytics(@PathVariable Long studentId) {
        try {
            return new ResponseEntity<>(courseService.getStudentAnalytics(studentId), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get student analytics", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ======================== ASSIGNMENT ========================
    @Operation(summary = "Devoirs par module", description = "Retourne la liste des devoirs disponibles dans un module.")
    @GetMapping("/assignments/module/{moduleId}")
    public ResponseEntity<?> getAssignmentsByModuleId(@PathVariable Long moduleId) {
        try {
            return new ResponseEntity<>(courseService.getAssignmentsByModuleId(moduleId), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get assignments", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/assignments")
    public ResponseEntity<?> createAssignment(@RequestBody com.lms.course.dto.AssignmentCreateDto dto) {
        try {
            return new ResponseEntity<>(courseService.createAssignmentFromDto(dto), HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/assignments/{id}")
    public ResponseEntity<?> getAssignmentById(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(courseService.getAssignmentById(id), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/assignments/{id}")
    public ResponseEntity<?> updateAssignment(@PathVariable Long id, @RequestBody com.lms.course.dto.AssignmentCreateDto dto) {
        try {
            return new ResponseEntity<>(courseService.updateAssignmentFromDto(id, dto), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Supprimer un devoir", description = "Supprime un devoir et toutes ses soumissions associées.")
    @DeleteMapping("/assignments/{id}")
    public ResponseEntity<?> deleteAssignment(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(courseService.deleteAssignment(id), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete assignment: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Obtenir les détails d'une soumission de devoir", description = "Retourne le résultat détaillé d'un devoir (score, corrections, analyse IA).")
    @GetMapping("/assignments/submissions/{id}")
    public ResponseEntity<?> getAssignmentSubmissionById(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(courseService.getAssignmentSubmissionDetails(id), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Soumettre un devoir", description = "Soumet les réponses d'un étudiant et déclenche la correction automatique par l'IA.")
    @PostMapping("/assignments/{assignmentId}/submit")
    public ResponseEntity<?> submitAssignment(
            @PathVariable Long assignmentId,
            @RequestBody com.lms.course.dto.AssignmentSubmissionDto dto) {
        try {
            dto.setAssignmentId(assignmentId);
            com.lms.course.dto.AssignmentSubmissionResultDto result = courseService.submitAssignmentFromDto(dto);
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Erreur lors de la soumission : " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ======================== QUIZ ========================

    @Operation(summary = "Quiz par module", description = "Retourne la liste des quiz disponibles dans un module.")
    @GetMapping("/quiz/module/{moduleId}")
    public ResponseEntity<?> getQuizzesByModuleId(@PathVariable Long moduleId) {
        try {
            return new ResponseEntity<>(courseService.getQuizzesByModuleId(moduleId), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get quizzes", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Obtenir un quiz par ID (prof)", description = "Retourne les détails complets d'un quiz avec questions, options et réponses correctes.")
    @GetMapping("/quiz/{id}")
    public ResponseEntity<?> getQuizById(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(courseService.getQuizById(id), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get quiz", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Obtenir un quiz pour étudiant", description = "Retourne un quiz avec ses questions mais sans les réponses correctes ni les justifications.")
    @GetMapping("/quiz/{id}/take")
    public ResponseEntity<?> getQuizForStudent(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(courseService.getQuizForStudent(id), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get quiz", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Créer un quiz", description = "Crée un nouveau quiz avec ses questions et options de réponse.")
    @PostMapping("/quiz")
    public ResponseEntity<?> createQuiz(@RequestBody com.lms.course.dto.QuizCreateDto dto) {
        try {
            return new ResponseEntity<>(courseService.createQuizFromDto(dto), HttpStatus.CREATED);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("already exists")) {
                return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
            }
            return new ResponseEntity<>("Failed to create quiz: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to create quiz: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Modifier un quiz", description = "Met à jour un quiz existant (questions, options, etc.). Les questions ne peuvent pas être modifiées si des soumissions existent.")
    @PutMapping("/quiz/{id}")
    public ResponseEntity<?> updateQuiz(@PathVariable Long id, @RequestBody com.lms.course.dto.QuizCreateDto dto) {
        try {
            return new ResponseEntity<>(courseService.updateQuiz(id, dto), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (ConflictException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update quiz", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Supprimer un quiz", description = "Supprime un quiz et toutes ses questions associées.")
    @DeleteMapping("/quiz/{id}")
    public ResponseEntity<?> deleteQuiz(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(courseService.deleteQuiz(id), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Failed to delete quiz: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ======================== RÉSULTATS QUIZ ========================

    @Operation(summary = "Soumettre un quiz", description = "Soumet les réponses d'un étudiant à un quiz, calcule le score et retourne le résultat détaillé avec corrections.")
    @PostMapping("/quiz/submit")
    public ResponseEntity<?> submitQuiz(@RequestBody com.lms.course.dto.QuizSubmissionDto dto) {
        try {
            return new ResponseEntity<>(courseService.submitQuizWithDetails(dto), HttpStatus.CREATED);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (ConflictException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to submit quiz: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Détail d'un résultat de quiz", description = "Retourne le détail complet d'un résultat (corrections, options correctes, justifications).")
    @GetMapping("/quiz/result/{resultId}/details")
    public ResponseEntity<?> getQuizResultDetails(@PathVariable Long resultId) {
        try {
            return new ResponseEntity<>(courseService.getQuizResultDetails(resultId), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get quiz result details", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Résultats quiz d'un étudiant", description = "Retourne tous les résultats de quiz d'un étudiant.")
    @GetMapping("/quiz/result/student/{studentId}")
    public ResponseEntity<?> getQuizResultsByStudentId(@PathVariable String studentId) {
        try {
            return new ResponseEntity<>(courseService.getQuizResultsByStudentId(studentId), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get student quiz results", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Résultats d'un quiz", description = "Retourne tous les résultats des étudiants pour un quiz donné.")
    @GetMapping("/quiz/result/quiz/{quizId}")
    public ResponseEntity<?> getQuizResultsByQuizId(@PathVariable Long quizId) {
        try {
            return new ResponseEntity<>(courseService.getQuizResultsByQuizId(quizId), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get quiz results", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Résultats quiz par module", description = "Retourne tous les résultats de quiz pour un module donné (analytics admin).")
    @GetMapping("/quiz/result/module/{moduleId}")
    public ResponseEntity<?> getQuizResultsByModuleId(@PathVariable Long moduleId) {
        try {
            return new ResponseEntity<>(quizResultRepository.findByModuleId(moduleId), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get quiz results for module", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ======================== APPRENTISSAGE ADAPTATIF ========================

    @Operation(summary = "Recommandations adaptatives", description = "Retourne des modules recommandés basés sur les lacunes identifiées de l'étudiant.")
    @GetMapping("/adaptive/recommendations/{studentId}")
    public ResponseEntity<?> getRecommendedModules(@PathVariable String studentId) {
        try {
            return new ResponseEntity<>(courseService.getRecommendedModules(studentId), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get recommendations", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Lacunes d'un étudiant", description = "Retourne les lacunes identifiées pour un étudiant.")
    @GetMapping("/adaptive/lacunes/{studentId}")
    public ResponseEntity<?> getLacunesByStudentId(@PathVariable String studentId) {
        try {
            return new ResponseEntity<>(courseService.getLacunesByStudentId(studentId), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get lacunes", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ======================== FORUM ========================

    @Operation(summary = "Tous les fils de discussion", description = "Retourne tous les fils de discussion de tous les modules.")
    @GetMapping("/forum/threads")
    public ResponseEntity<?> getAllForumThreads() {
        try {
            return new ResponseEntity<>(courseService.getAllForumThreads(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get all forum threads", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Fils de discussion par module", description = "Retourne tous les fils de discussion du forum d'un module.")
    @GetMapping("/forum/module/{moduleId}")
    public ResponseEntity<?> getForumThreadsByModuleId(@PathVariable Long moduleId) {
        try {
            return new ResponseEntity<>(courseService.getForumThreadsByModuleId(moduleId), HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Failed to get forum threads: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Obtenir un fil de discussion", description = "Retourne un fil de discussion avec tous ses posts.")
    @GetMapping("/forum/thread/{id}")
    public ResponseEntity<?> getForumThreadById(@PathVariable Long id, @RequestParam(required = false) String username) {
        try {
            return new ResponseEntity<>(courseService.getForumThreadById(id, username), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to get forum thread", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Créer un fil de discussion", description = "Crée un nouveau fil de discussion dans le forum d'un module.")
    @PostMapping("/forum/thread")
    public ResponseEntity<?> createForumThread(@RequestBody com.lms.course.dto.ForumThreadCreateDto dto) {
        try {
            return new ResponseEntity<>(courseService.createForumThread(dto), HttpStatus.CREATED);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (ConflictException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to create forum thread: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Modifier un fil de discussion", description = "Met à jour un fil de discussion existant.")
    @PutMapping("/forum/thread/{id}")
    public ResponseEntity<?> updateForumThread(@PathVariable Long id, @RequestBody com.lms.course.dto.ForumThreadCreateDto dto) {
        try {
            return new ResponseEntity<>(courseService.updateForumThread(id, dto), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update forum thread", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Supprimer un fil de discussion", description = "Supprime un fil de discussion et tous ses posts.")
    @DeleteMapping("/forum/thread/{id}")
    public ResponseEntity<?> deleteForumThread(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(courseService.deleteForumThread(id), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete forum thread", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Répondre dans un fil", description = "Ajoute un post (réponse) à un fil de discussion existant.")
    @PostMapping("/forum/post")
    public ResponseEntity<?> createForumPost(@RequestBody com.lms.course.dto.ForumPostCreateDto dto) {
        try {
            return new ResponseEntity<>(courseService.createForumPost(dto), HttpStatus.CREATED);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to create forum post: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Modifier un post", description = "Met à jour le contenu d'un post existant.")
    @PutMapping("/forum/post/{id}")
    public ResponseEntity<?> updateForumPost(@PathVariable Long id, @RequestBody String content) {
        try {
            return new ResponseEntity<>(courseService.updateForumPost(id, content), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update forum post", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Supprimer un post", description = "Supprime un post et ses réponses.")
    @DeleteMapping("/forum/post/{id}")
    public ResponseEntity<?> deleteForumPost(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(courseService.deleteForumPost(id), HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete forum post", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Voter pour un fil", description = "Ajoute un vote positif (upvote) à un fil de discussion.")
    @PostMapping("/forum/thread/{id}/upvote/{userId}")
    public ResponseEntity<?> upvoteThread(@PathVariable Long id, @PathVariable String userId) {
        try {
            courseService.upvoteThread(id, userId);
            return new ResponseEntity<>("Thread upvoted", HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to upvote thread", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Retirer le vote d'un fil", description = "Retire un vote positif d'un fil de discussion.")
    @DeleteMapping("/forum/thread/{id}/upvote/{userId}")
    public ResponseEntity<?> removeUpvoteThread(@PathVariable Long id, @PathVariable String userId) {
        try {
            courseService.removeUpvoteThread(id, userId);
            return new ResponseEntity<>("Upvote removed", HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to remove upvote", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Voter pour un post", description = "Ajoute un vote positif à un post de forum.")
    @PostMapping("/forum/post/{id}/upvote/{userId}")
    public ResponseEntity<?> upvotePost(@PathVariable Long id, @PathVariable String userId) {
        try {
            courseService.upvotePost(id, userId);
            return new ResponseEntity<>("Post upvoted", HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to upvote post", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Retirer le vote d'un post", description = "Retire un vote positif d'un post de forum.")
    @DeleteMapping("/forum/post/{id}/upvote/{userId}")
    public ResponseEntity<?> removeUpvotePost(@PathVariable Long id, @PathVariable String userId) {
        try {
            courseService.removeUpvotePost(id, userId);
            return new ResponseEntity<>("Upvote removed", HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to remove upvote", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Marquer un post comme solution", description = "Permet à un enseignant de marquer un post comme la solution d'un fil de discussion.")
    @PutMapping("/forum/thread/{threadId}/solution/{postId}")
    public ResponseEntity<?> markPostAsSolution(@PathVariable Long threadId, @PathVariable Long postId) {
        try {
            courseService.markPostAsSolution(postId, threadId);
            return new ResponseEntity<>("Post marked as solution", HttpStatus.OK);
        } catch (NotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (ConflictException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to mark post as solution", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Obtenir les étudiants à risque", description = "Retourne la liste des étudiants identifiés comme étant à risque de décrochage pour un enseignant donné.")
    @GetMapping("/analytics/at-risk/{username}")
    public ResponseEntity<?> getAtRiskStudents(
            @PathVariable String username,
            @RequestParam(required = false) Long moduleId) {
        try {
            return ResponseEntity.ok(courseService.getAtRiskStudents(username, moduleId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to retrieve at-risk students: " + e.getMessage());
        }
    }
}
