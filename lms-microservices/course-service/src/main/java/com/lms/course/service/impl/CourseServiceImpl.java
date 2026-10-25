package com.lms.course.service.impl;

import com.lms.course.dto.CourseSessionDto;
import com.lms.course.dto.CourseUpdateDto;
import com.lms.course.dto.ForumThreadDetailDto;
import com.lms.course.dto.ModuleUpdateDto;
import com.lms.course.entity.CModule;
import com.lms.course.entity.Course;
import com.lms.course.entity.ForumThread;
import com.lms.course.entity.TeachingUnit;
import com.lms.course.exception.ConflictException;
import com.lms.course.exception.NotFoundException;
import com.lms.course.repository.CourseRepository;
import com.lms.course.repository.ModuleRepository;
import com.lms.course.repository.TeachingUnitRepository;
import com.lms.course.service.CourseService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Service
public class CourseServiceImpl implements CourseService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CourseServiceImpl.class);

    private CourseRepository courseRepository;
    private ModuleRepository moduleRepository;
    private TeachingUnitRepository teachingUnitRepository;
    private com.lms.course.repository.MaterialRepository materialRepository;
    private com.lms.course.repository.GradeRepository gradeRepository;
    private com.lms.course.repository.AssignmentRepository assignmentRepository;
    private com.lms.course.repository.SubmissionRepository submissionRepository;
    private com.lms.course.repository.AttendanceRepository attendanceRepository;
    private com.lms.course.repository.QuizRepository quizRepository;
    private com.lms.course.repository.QuizResultRepository quizResultRepository;
    private com.lms.course.repository.ForumThreadRepository forumThreadRepository;
    private com.lms.course.repository.ForumPostRepository forumPostRepository;
    private com.lms.course.repository.ForumUpvoteRepository forumUpvoteRepository;
    private com.lms.course.repository.ForumThreadViewRepository forumThreadViewRepository;
    private com.lms.course.client.AiClient aiClient;
    private com.lms.course.client.UserClient userClient;
    private com.lms.course.repository.LacuneRepository lacuneRepository;
    private com.lms.course.repository.QuestionRepository questionRepository;
    private com.lms.course.repository.StudentAnswerRepository studentAnswerRepository;
    private com.lms.course.repository.QuestionOptionRepository questionOptionRepository;
    private com.lms.course.repository.AdaptiveSessionResultRepository adaptiveSessionResultRepository;
    private com.lms.course.repository.IntegrityReportRepository integrityReportRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.web.client.RestTemplate restTemplate;

    // Simple cache for lecturer names to avoid hammering user-service
    private static final java.util.Map<String, String> nameCache = new java.util.concurrent.ConcurrentHashMap<>();
    private static long lastCacheUpdate = 0;
    private static final long CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    // Simple cache for student levels to avoid hammering user-service
    private static final java.util.Map<String, String> studentLevelCache = new java.util.concurrent.ConcurrentHashMap<>();
    private static final long STUDENT_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
    private static final java.util.Map<String, Long> studentCacheTimestamps = new java.util.concurrent.ConcurrentHashMap<>();

    public CourseServiceImpl(CourseRepository courseRepository, ModuleRepository moduleRepository,
                           TeachingUnitRepository teachingUnitRepository,
                           com.lms.course.repository.MaterialRepository materialRepository,
                           com.lms.course.repository.GradeRepository gradeRepository,
                           com.lms.course.repository.AssignmentRepository assignmentRepository,
                           com.lms.course.repository.SubmissionRepository submissionRepository,
                           com.lms.course.repository.AttendanceRepository attendanceRepository,
                           com.lms.course.repository.QuizRepository quizRepository,
                           com.lms.course.repository.QuizResultRepository quizResultRepository,
                           com.lms.course.repository.ForumThreadRepository forumThreadRepository,
                           com.lms.course.repository.ForumPostRepository forumPostRepository,
                           com.lms.course.repository.ForumUpvoteRepository forumUpvoteRepository,
                           com.lms.course.repository.ForumThreadViewRepository forumThreadViewRepository,
                           com.lms.course.client.AiClient aiClient,
                           com.lms.course.client.UserClient userClient,
                           com.lms.course.repository.LacuneRepository lacuneRepository,
                           com.lms.course.repository.QuestionRepository questionRepository,
                           com.lms.course.repository.StudentAnswerRepository studentAnswerRepository,
                           com.lms.course.repository.QuestionOptionRepository questionOptionRepository,
                           com.lms.course.repository.AdaptiveSessionResultRepository adaptiveSessionResultRepository,
                           com.lms.course.repository.IntegrityReportRepository integrityReportRepository) {
        this.courseRepository = courseRepository;
        this.moduleRepository = moduleRepository;
        this.teachingUnitRepository = teachingUnitRepository;
        this.materialRepository = materialRepository;
        this.gradeRepository = gradeRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.attendanceRepository = attendanceRepository;
        this.quizRepository = quizRepository;
        this.quizResultRepository = quizResultRepository;
        this.forumThreadRepository = forumThreadRepository;
        this.forumPostRepository = forumPostRepository;
        this.forumUpvoteRepository = forumUpvoteRepository;
        this.forumThreadViewRepository = forumThreadViewRepository;
        this.aiClient = aiClient;
        this.userClient = userClient;
        this.lacuneRepository = lacuneRepository;
        this.questionRepository = questionRepository;
        this.studentAnswerRepository = studentAnswerRepository;
        this.questionOptionRepository = questionOptionRepository;
        this.adaptiveSessionResultRepository = adaptiveSessionResultRepository;
        this.integrityReportRepository = integrityReportRepository;
    }

    public Course createCourse(Course course) {
        // Pour les séances attachées à un module, le titre n'a pas besoin d'être unique globalement.
        // Le check d'unicité ne s'applique qu'aux cours autonomes (sans module).
        if (course.getModule() == null && courseRepository.existsByTitle(course.getTitle())) {
            throw new ConflictException("Course already exists");
        }
        return courseRepository.save(course);
    }

    public Course getCourseById(Long id) {
        Course course = courseRepository.findById(id).orElse(null);
        if (course == null) {
            throw new NotFoundException("Faculty not found");
        }
        return course;
    }

    public Course updateCourse(Long id, CourseUpdateDto courseUpdateDto) {
        Course course = courseRepository.findById(id).orElse(null);
        if (course == null) {
            throw new NotFoundException("Course not found with id " + id);
        }
        course.setTitle(courseUpdateDto.getTitle());
        course.setDescription(courseUpdateDto.getDescription());
        course.setLecturer(courseUpdateDto.getLecturer());
        course.setDuration(courseUpdateDto.getDuration());
        course.setLevel(courseUpdateDto.getLevel());
        course.setLanguage(courseUpdateDto.getLanguage());
        course.setFormat(courseUpdateDto.getFormat());
        course.setCredits(courseUpdateDto.getCredits());

        return courseRepository.save(course);
    }

    @org.springframework.transaction.annotation.Transactional
    public String deleteCourse(Long id) {
        Course course = courseRepository.findById(id).orElse(null);
        if (course == null) {
            throw new NotFoundException("Course not found");
        }
        // Delete quizzes first (with their questions, results, adaptive_session_results)
        if (course.getQuizzes() != null && !course.getQuizzes().isEmpty()) {
            for (com.lms.course.entity.Quiz quiz : course.getQuizzes()) {
                // Use the same logic as deleteQuiz
                List<com.lms.course.entity.QuizResult> results = quizResultRepository.findByQuiz(quiz);
                if (!results.isEmpty()) {
                    quizResultRepository.deleteAll(results);
                    quizResultRepository.flush();
                }
                List<com.lms.course.entity.Question> questions = questionRepository.findByQuiz(quiz);
                for (com.lms.course.entity.Question question : questions) {
                    List<com.lms.course.entity.AdaptiveSessionResult> adaptiveResults = adaptiveSessionResultRepository.findByQuestion(question);
                    if (!adaptiveResults.isEmpty()) {
                        adaptiveSessionResultRepository.deleteAll(adaptiveResults);
                        adaptiveSessionResultRepository.flush();
                    }
                }
                if (!questions.isEmpty()) {
                    questionRepository.deleteAll(questions);
                    questionRepository.flush();
                }
                quizRepository.delete(quiz);
            }
            quizRepository.flush();
        }
        // Delete materials
        if (course.getMaterials() != null && !course.getMaterials().isEmpty()) {
            materialRepository.deleteAll(course.getMaterials());
            materialRepository.flush();
        }
        courseRepository.delete(course);
        return "Course deleted successfully";
    }

    public List<Course> getAllCourses() {
        List<Course> courses = courseRepository.findAll();
        if (courses.isEmpty()) {
            throw new NotFoundException("No courses found");
        }
        return courses;
    }

    // get all modules
    public List<CModule> getModules() {
        List<CModule> modules = moduleRepository.findAll();
        if (modules.isEmpty()) {
            throw new NotFoundException("No modules found");
        }
        resolveLecturerNames(modules);
        return modules;
    }

    // Get Module by id
    public CModule getModuleById(Long id) {
        CModule module = moduleRepository.findById(id).orElse(null);
        if(module == null) {
            throw new NotFoundException("Module not found");
        }
        resolveLecturerName(module);
        return module;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<CModule> getModulesByDepartmentId(Long departmentId) {
        return moduleRepository.findModulesByDepartmentId(departmentId);
    }

    @Transactional
    public CModule createModule(CModule module) {
        // Validation: codeEC unique
        if(module.getCodeEC() != null && moduleRepository.existsByCodeEC(module.getCodeEC())) {
            throw new ConflictException("Module with code " + module.getCodeEC() + " already exists");
        }

        // Validation: TeachingUnit obligatoire
        if (module.getTeachingUnit() == null || module.getTeachingUnit().getId() == null) {
            throw new IllegalArgumentException("TeachingUnit is required. A module (EC) must belong to a TeachingUnit (UE).");
        }

        // Vérifier que l'UE existe
        TeachingUnit tu = teachingUnitRepository.findById(module.getTeachingUnit().getId())
                .orElseThrow(() -> new NotFoundException("TeachingUnit not found with id: " + module.getTeachingUnit().getId()));

        module.setTeachingUnit(tu);

        return moduleRepository.save(module);
    }

    @Transactional
    public CModule updateModule(Long id, ModuleUpdateDto moduleUpdateDto) {
        CModule module = moduleRepository.findById(id).orElse(null);
        if (module == null) {
            throw new NotFoundException("Module not found");
        }

        // Basic info
        if (moduleUpdateDto.getCodeEC() != null) {
            module.setCodeEC(moduleUpdateDto.getCodeEC());
        }
        if (moduleUpdateDto.getName() != null) {
            module.setName(moduleUpdateDto.getName());
        }
        if (moduleUpdateDto.getDescription() != null) {
            module.setDescription(moduleUpdateDto.getDescription());
        }

        // Charge horaire
        if (moduleUpdateDto.getCmHours() != null) {
            module.setCmHours(moduleUpdateDto.getCmHours());
        }
        if (moduleUpdateDto.getTdHours() != null) {
            module.setTdHours(moduleUpdateDto.getTdHours());
        }
        if (moduleUpdateDto.getTpHours() != null) {
            module.setTpHours(moduleUpdateDto.getTpHours());
        }
        if (moduleUpdateDto.getTpeHours() != null) {
            module.setTpeHours(moduleUpdateDto.getTpeHours());
        }

        // Crédits et classification
        if (moduleUpdateDto.getCreditsEC() != null) {
            module.setCreditsEC(moduleUpdateDto.getCreditsEC());
        }
        if (moduleUpdateDto.getSemester() != null) {
            module.setSemester(moduleUpdateDto.getSemester());
        }
        if (moduleUpdateDto.getLevel() != null) {
            module.setLevel(moduleUpdateDto.getLevel());
        }

        // Relations
        if (moduleUpdateDto.getTeachingUnitId() != null) {
            TeachingUnit tu = teachingUnitRepository.findById(moduleUpdateDto.getTeachingUnitId())
                    .orElseThrow(() -> new NotFoundException("TeachingUnit not found"));
            module.setTeachingUnit(tu);
        }
        if (moduleUpdateDto.getLecturerUsername() != null) {
            module.setLecturerUsername(moduleUpdateDto.getLecturerUsername());
        }

        // Avancement
        if (moduleUpdateDto.getCompletedHours() != null) {
            module.setCompletedHours(moduleUpdateDto.getCompletedHours());
        }
        if (moduleUpdateDto.getIsValidated() != null) {
            module.setIsValidated(moduleUpdateDto.getIsValidated());
        }

        // Dates
        if (moduleUpdateDto.getStartDate() != null) {
            module.setStartDate(moduleUpdateDto.getStartDate());
        }
        if (moduleUpdateDto.getEndDate() != null) {
            module.setEndDate(moduleUpdateDto.getEndDate());
        }

        return moduleRepository.save(module);
    }

    public String deleteModule(Long id) {
        CModule module = moduleRepository.findById(id).orElse(null);
        if (module == null) {
            throw new NotFoundException("Module not found");
        }
        moduleRepository.delete(module);
        return "Module deleted successfully";
    }

    // get all courses by module id
    public List<Course> getCoursesByModuleId(Long moduleId) {
        return courseRepository.findByModuleId(moduleId);
    }

    public List<CModule> getModulesByCourseId(Long courseId) {
        return getModulesByCourseId(courseId, null);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<CModule> getModulesByCourseId(Long courseId, String level) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) {
            throw new NotFoundException("Course not found");
        }

        // Strategy: If course has a department, return all modules of all courses in that department
        // IF a level is provided, filter those modules by level
        if (course.getDepartmentId() != null) {
            List<Course> deptCourses = courseRepository.findByDepartmentId(course.getDepartmentId());
            return deptCourses.stream()
                    .filter(c -> level == null || (c.getLevel() != null && c.getLevel().equalsIgnoreCase(level)))
                    .map(Course::getModule)
                    .filter(java.util.Objects::nonNull)
                    .filter(m -> level == null || (m.getLevel() != null && m.getLevel().equalsIgnoreCase(level)))
                    .distinct()
                    .collect(java.util.stream.Collectors.toList());
        }

        // Fallback: return only the module of this course
        if (course.getModule() != null) {
            CModule m = course.getModule();
            if (level == null || (m.getLevel() != null && m.getLevel().equalsIgnoreCase(level))) {
                return java.util.List.of(m);
            }
        }

        return java.util.Collections.emptyList();
    }

    public List<CModule> getModulesByLecturer(String lecturerUsername) {
        List<CModule> modules = moduleRepository.findByLecturerUsername(lecturerUsername);
        resolveLecturerNames(modules);
        return modules;
    }

    public List<CModule> getModulesByStudent(String username) {
        String level = studentLevelCache.get(username);
        Long lastUpdate = studentCacheTimestamps.get(username);
        boolean needsRefresh = lastUpdate == null || (System.currentTimeMillis() - lastUpdate > STUDENT_CACHE_DURATION);

        if (needsRefresh) {
            // Get student details to find their level
            String studentUrl = "http://user-service/api/user/student/" + username + "/username";
            try {
                java.util.Map<String, Object> student = restTemplate.getForObject(studentUrl, java.util.Map.class);
                if (student != null && student.get("intake") != null) {
                    level = student.get("intake").toString();
                    studentLevelCache.put(username, level);
                    studentCacheTimestamps.put(username, System.currentTimeMillis());
                }
            } catch (Exception e) {
                log.error("Failed to fetch student level for {}: {}", username, e.getMessage());
            }
        }

        if (level == null) {
            return java.util.Collections.emptyList();
        }

        // Get modules by student's level (intake)
        List<CModule> modules = moduleRepository.findByLevelIgnoreCase(level);
        resolveLecturerNames(modules);
        return modules;
    }

    public List<java.util.Map<String, Object>> getStudentsByModule(Long moduleId) {
        CModule module = moduleRepository.findById(moduleId).orElse(null);
        if (module == null) {
            return java.util.Collections.emptyList();
        }

        // Get students by module's level
        String level = module.getLevel();
        if (level == null) {
            return java.util.Collections.emptyList();
        }

        String studentsUrl = "http://user-service/api/user/student/level/" + level;
        try {
            java.util.List<java.util.Map<String, Object>> students = restTemplate.getForObject(
                studentsUrl,
                java.util.List.class
            );
            if (students == null) {
                return java.util.Collections.emptyList();
            }
            return students.stream()
                .map(s -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("username", s.get("username"));
                    map.put("firstName", s.get("firstName"));
                    map.put("lastName", s.get("lastName"));
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            return java.util.Collections.emptyList();
        }
    }

    public List<CModule> getModulesByTeachingUnit(Long teachingUnitId) {
        List<CModule> modules = moduleRepository.findByTeachingUnitId(teachingUnitId);
        resolveLecturerNames(modules);
        return modules;
    }

    public List<CModule> getModulesBySemester(String semester) {
        List<CModule> modules = moduleRepository.findBySemester(semester);
        resolveLecturerNames(modules);
        return modules;
    }

    public List<CModule> getModulesByLevel(String level) {
        List<CModule> modules = moduleRepository.findByLevelIgnoreCase(level);
        resolveLecturerNames(modules);
        return modules;
    }

    public List<CModule> getModulesBySemesterAndLevel(String semester, String level) {
        List<CModule> modules = moduleRepository.findBySemesterAndLevel(semester, level);
        resolveLecturerNames(modules);
        return modules;
    }

    public CModule getModuleByCodeEC(String codeEC) {
        CModule module = moduleRepository.findByCodeEC(codeEC)
                .orElseThrow(() -> new NotFoundException("Module with code " + codeEC + " not found"));
        resolveLecturerName(module);
        return module;
    }

    private void resolveLecturerNames(List<CModule> modules) {
        if (modules == null || modules.isEmpty()) return;

        // 1. Try to fill from cache first
        modules.forEach(m -> {
            if (m.getLecturerUsername() != null && m.getLecturerFullName() == null) {
                m.setLecturerFullName(nameCache.get(m.getLecturerUsername()));
            }
        });

        // 2. Check if we need to refresh cache
        boolean needsRefresh = System.currentTimeMillis() - lastCacheUpdate > CACHE_DURATION;
        boolean hasMissingNames = modules.stream().anyMatch(m -> m.getLecturerUsername() != null && m.getLecturerFullName() == null);

        if (!needsRefresh && !hasMissingNames) return;

        // 3. Update cache from user-service
        try {
            String contactsUrl = "http://user-service/api/user/contacts";
            java.util.List<java.util.Map<String, String>> contacts = restTemplate.getForObject(contactsUrl, java.util.List.class);
            if (contacts != null) {
                for (java.util.Map<String, String> c : contacts) {
                    String uname = c.get("username");
                    String disp = c.get("displayName");
                    if (uname != null && disp != null) {
                        String clean = disp.replaceAll("(?i)\\s*\\(Prof\\)$", "")
                                          .replaceAll("(?i)\\s*\\(Etudiant\\)$", "")
                                          .replaceAll("(?i)^Admin:\\s*", "")
                                          .trim();
                        nameCache.put(uname, clean);
                    }
                }
                lastCacheUpdate = System.currentTimeMillis();

                // 4. Final attempt to fill missing names
                modules.forEach(m -> {
                    if (m.getLecturerUsername() != null && m.getLecturerFullName() == null) {
                        m.setLecturerFullName(nameCache.get(m.getLecturerUsername()));
                    }
                });
            }
        } catch (Exception e) {
            log.error("Failed to resolve lecturer names from user-service: {}", e.getMessage());
        }
    }

    private void resolveLecturerName(CModule module) {
        if (module == null) return;
        resolveLecturerNames(java.util.List.of(module));
    }

    // ======================== TEACHING UNIT (UE) ========================

    @Transactional
    public TeachingUnit createTeachingUnit(TeachingUnit teachingUnit) {
        if (teachingUnitRepository.existsByCode(teachingUnit.getCode())) {
            throw new ConflictException("TeachingUnit with code " + teachingUnit.getCode() + " already exists");
        }
        return teachingUnitRepository.save(teachingUnit);
    }

    public TeachingUnit getTeachingUnitById(Long id) {
        return teachingUnitRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TeachingUnit not found"));
    }

    public TeachingUnit getTeachingUnitByCode(String code) {
        return teachingUnitRepository.findByCode(code)
                .orElseThrow(() -> new NotFoundException("TeachingUnit with code " + code + " not found"));
    }

    public List<TeachingUnit> getAllTeachingUnits() {
        List<TeachingUnit> units = teachingUnitRepository.findAll();
        if (units.isEmpty()) {
            throw new NotFoundException("No TeachingUnits found");
        }
        return units;
    }

    public List<TeachingUnit> getTeachingUnitsBySemester(String semester) {
        return teachingUnitRepository.findBySemester(semester);
    }

    public List<TeachingUnit> getTeachingUnitsByClassId(Long classId) {
        return teachingUnitRepository.findByClassId(classId);
    }

    @Transactional
    public TeachingUnit updateTeachingUnit(Long id, TeachingUnit teachingUnit) {
        TeachingUnit existing = teachingUnitRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TeachingUnit not found"));

        if (teachingUnit.getName() != null) {
            existing.setName(teachingUnit.getName());
        }
        if (teachingUnit.getCode() != null) {
            existing.setCode(teachingUnit.getCode());
        }
        if (teachingUnit.getDescription() != null) {
            existing.setDescription(teachingUnit.getDescription());
        }
        if (teachingUnit.getSemester() != null) {
            existing.setSemester(teachingUnit.getSemester());
        }
        if (teachingUnit.getCreditsUE() != null) {
            existing.setCreditsUE(teachingUnit.getCreditsUE());
        }
        if (teachingUnit.getDepartmentId() != null) {
            existing.setDepartmentId(teachingUnit.getDepartmentId());
        }
        if (teachingUnit.getClassId() != null) {
            existing.setClassId(teachingUnit.getClassId());
        }

        return teachingUnitRepository.save(existing);
    }

    @Transactional
    public String deleteTeachingUnit(Long id) {
        TeachingUnit unit = teachingUnitRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TeachingUnit not found"));
        teachingUnitRepository.delete(unit);
        return "TeachingUnit deleted successfully";
    }

    // assign course to module
    public String assignCourseToModule(Long courseId, Long moduleId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) {
            throw new NotFoundException("Course not found");
        }
        CModule module = moduleRepository.findById(moduleId).orElse(null);
        if (module == null) {
            throw new NotFoundException("Module not found");
        }
        course.setModule(module);
        courseRepository.save(course);
        return "Course assigned to module successfully";
    }

    // list courses without assigned to module
    public List<Course> getCoursesWithoutAssignedToModule() {
        List<Course> courses = courseRepository.findByModuleIsNull();
        if (courses.isEmpty()) {
            throw new NotFoundException("No courses found");
        }
        return courses;
    }

    // Unassign course from module
    public String unassignCourseFromModule(Long courseId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) {
            throw new NotFoundException("Course not found");
        }
        course.setModule(null);
        courseRepository.save(course);
        return "Course unassigned from module successfully";
    }

    public List<Course> getCoursesWithoutAssigned() {
        List<Course> courses = courseRepository.findByDepartmentIdIsNull();
        if (courses.isEmpty()) {
            throw new NotFoundException("No courses found");
        }
        return courses;
    }

    public List<Course> getCoursesByDepartmentId(Long departmentId) {
        List<Course> courses = courseRepository.findByDepartmentId(departmentId);
        if (courses.isEmpty()) {
            throw new NotFoundException("No courses found");
        }
        return courses;
    }

    public String unassignCourseFromDepartment(Long courseId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) {
            throw new NotFoundException("Course not found");
        }
        course.setDepartmentId(null);
        courseRepository.save(course);
        return "Course unassigned from department successfully";
    }

    public String getCourseNameById(Long courseId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) {
            throw new NotFoundException("Course not found");
        }
        return course.getTitle();
    }

    // ======================== COURSE SESSION (SÉANCE) ========================

    @Transactional
    public Course createCourseSession(Long moduleId, CourseSessionDto sessionDto, String lecturerUsername) {
        // Vérifier que le module existe
        CModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new NotFoundException("Module not found with id: " + moduleId));

        // Sécurité: vérifier uniquement si un username explicite est fourni et ne correspond pas
        if (lecturerUsername != null && !lecturerUsername.isBlank()
                && !lecturerUsername.equals("default_lecturer")
                && module.getLecturerUsername() != null
                && !module.getLecturerUsername().equals(lecturerUsername)) {
            throw new SecurityException("You are not authorized to create sessions for this module");
        }

        // Créer la séance
        Course session = new Course();
        session.setModule(module);
        session.setTitle(sessionDto.getTitle());
        session.setDescription(sessionDto.getDescription());
        session.setSessionDate(sessionDto.getSessionDate());
        session.setOrdre(sessionDto.getOrdre());
        session.setDuree(sessionDto.getDuree());
        session.setTypeSeance(sessionDto.getTypeSeance());
        session.setObjectifs(sessionDto.getObjectifs());
        session.setContenu(sessionDto.getContenu());
        session.setStatus(sessionDto.getStatus() != null ? sessionDto.getStatus() : "DRAFT");
        session.setFormat(sessionDto.getFormat() != null ? sessionDto.getFormat() : "in-person");
        session.setAutoCreateMeeting(sessionDto.getAutoCreateMeeting() != null ? sessionDto.getAutoCreateMeeting() : false);
        session.setMeetingRoomName(sessionDto.getMeetingRoomName());

        return courseRepository.save(session);
    }

    @Transactional
    public Course updateCourseSession(Long sessionId, CourseSessionDto sessionDto, String lecturerUsername) {
        Course session = courseRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Course session not found with id: " + sessionId));

        // Sécurité: vérifier que l'utilisateur est le prof du module
        if (session.getModule() == null || !session.getModule().getLecturerUsername().equals(lecturerUsername)) {
            throw new SecurityException("You are not authorized to update this session");
        }

        // Mettre à jour les champs fournis
        if (sessionDto.getTitle() != null) {
            session.setTitle(sessionDto.getTitle());
        }
        if (sessionDto.getDescription() != null) {
            session.setDescription(sessionDto.getDescription());
        }
        if (sessionDto.getStatus() != null) {
            session.setStatus(sessionDto.getStatus());
        }
        if (sessionDto.getSessionDate() != null) {
            session.setSessionDate(sessionDto.getSessionDate());
        }
        if (sessionDto.getOrdre() != null) {
            session.setOrdre(sessionDto.getOrdre());
        }
        if (sessionDto.getDuree() != null) {
            session.setDuree(sessionDto.getDuree());
        }
        if (sessionDto.getTypeSeance() != null) {
            session.setTypeSeance(sessionDto.getTypeSeance());
        }
        if (sessionDto.getObjectifs() != null) {
            session.setObjectifs(sessionDto.getObjectifs());
        }
        if (sessionDto.getContenu() != null) {
            session.setContenu(sessionDto.getContenu());
        }
        if (sessionDto.getFormat() != null) {
            session.setFormat(sessionDto.getFormat());
        }
        if (sessionDto.getAutoCreateMeeting() != null) {
            session.setAutoCreateMeeting(sessionDto.getAutoCreateMeeting());
        }
        if (sessionDto.getMeetingRoomName() != null) {
            session.setMeetingRoomName(sessionDto.getMeetingRoomName());
        }

        return courseRepository.save(session);
    }

    public Course getCourseSessionById(Long sessionId) {
        return courseRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Course session not found with id: " + sessionId));
    }

    public List<Course> getCourseSessionsByModuleId(Long moduleId) {
        List<Course> sessions = courseRepository.findByModuleIdOrderByOrdreAsc(moduleId);
        if (sessions != null) {
            for (Course session : sessions) {
                session.setHasAttendance(attendanceRepository.existsByCourseId(session.getId()));
            }
        }
        return sessions;
    }

    @org.springframework.transaction.annotation.Transactional
    public String deleteCourseSession(Long sessionId, String lecturerUsername) {
        Course session = courseRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Course session not found with id: " + sessionId));

        // Sécurité: vérifier que l'utilisateur est le prof du module
        if (session.getModule() == null || !session.getModule().getLecturerUsername().equals(lecturerUsername)) {
            throw new SecurityException("You are not authorized to delete this session");
        }

        // Vérifier si des étudiants ont déjà émargé pour cette séance
        List<com.lms.course.entity.Attendance> attendances = attendanceRepository.findByCourseId(sessionId);
        if (attendances != null && !attendances.isEmpty()) {
            throw new IllegalStateException("Impossible de supprimer cette séance car des étudiants y ont déjà émargé");
        }

        // Delete quizzes first (with their questions, results, adaptive_session_results)
        if (session.getQuizzes() != null && !session.getQuizzes().isEmpty()) {
            for (com.lms.course.entity.Quiz quiz : session.getQuizzes()) {
                List<com.lms.course.entity.QuizResult> results = quizResultRepository.findByQuiz(quiz);
                if (!results.isEmpty()) {
                    quizResultRepository.deleteAll(results);
                    quizResultRepository.flush();
                }
                List<com.lms.course.entity.Question> questions = questionRepository.findByQuiz(quiz);
                for (com.lms.course.entity.Question question : questions) {
                    List<com.lms.course.entity.AdaptiveSessionResult> adaptiveResults = adaptiveSessionResultRepository.findByQuestion(question);
                    if (!adaptiveResults.isEmpty()) {
                        adaptiveSessionResultRepository.deleteAll(adaptiveResults);
                        adaptiveSessionResultRepository.flush();
                    }
                }
                if (!questions.isEmpty()) {
                    questionRepository.deleteAll(questions);
                    questionRepository.flush();
                }
                quizRepository.delete(quiz);
            }
            quizRepository.flush();
        }
        // Delete materials
        if (session.getMaterials() != null && !session.getMaterials().isEmpty()) {
            materialRepository.deleteAll(session.getMaterials());
            materialRepository.flush();
        }
        courseRepository.delete(session);
        return "Course session deleted successfully";
    }

    // ======================== MATERIALS ========================

    public List<com.lms.course.entity.Material> getMaterialsByCourseId(Long courseId) {
        return materialRepository.findByCourseId(courseId);
    }

    public List<com.lms.course.entity.Material> getMaterialsByModuleId(Long moduleId) {
        return materialRepository.findByModuleId(moduleId);
    }

    @org.springframework.transaction.annotation.Transactional
    public com.lms.course.entity.Material createMaterial(com.lms.course.dto.MaterialRequestDto dto) {
        Course course = null;
        CModule module = null;
        if (dto.getCourseId() != null) {
            course = courseRepository.findById(dto.getCourseId())
                    .orElseThrow(() -> new NotFoundException("Course not found with id: " + dto.getCourseId()));
            module = course.getModule();
        }
        if (module == null && dto.getModuleId() != null) {
            module = moduleRepository.findById(dto.getModuleId())
                    .orElseThrow(() -> new NotFoundException("Module not found with id: " + dto.getModuleId()));
        }
        if (module == null) {
            throw new NotFoundException("Either courseId or moduleId must be provided");
        }

        com.lms.course.entity.Material material = new com.lms.course.entity.Material();
        material.setTitle(dto.getTitle());
        material.setDescription(dto.getDescription());
        material.setType(dto.getType());
        material.setFileUrl(dto.getFileUrl());
        material.setModule(module);
        material.setCourse(course);
        com.lms.course.entity.Material savedMaterial = materialRepository.save(material);

        // Notify students
        notifyStudents(module, 
            "Nouveau support : " + savedMaterial.getTitle(),
            "Un nouveau support de cours a été ajouté au module " + module.getName(),
            "COURSE");

        // Auto-index if it's a PDF or TXT
        String type = savedMaterial.getType();
        if (("PDF".equalsIgnoreCase(type) || "TXT".equalsIgnoreCase(type) || "TEXT".equalsIgnoreCase(type))
            && savedMaterial.getFileUrl() != null) {
            try {
                aiClient.indexMaterial(savedMaterial.getId(),
                                     savedMaterial.getModule().getId().toString(),
                                     savedMaterial.getFileUrl());
            } catch (Exception e) {
                // Log error but don't fail material creation
            }
        }

        return savedMaterial;
    }

    public String deleteMaterial(Long id) {
        com.lms.course.entity.Material material = materialRepository.findById(id).orElse(null);
        if (material == null) {
            throw new NotFoundException("Material not found");
        }
        materialRepository.delete(material);
        return "Material deleted successfully";
    }

    public List<com.lms.course.dto.GradeResponseDto> getGradesByStudentId(Long studentId) {
        return gradeRepository.findByStudentId(studentId).stream()
                .map(com.lms.course.dto.GradeResponseDto::fromEntity).toList();
    }

    public List<com.lms.course.dto.GradeResponseDto> getGradesByModuleId(Long moduleId) {
        return gradeRepository.findByModuleId(moduleId).stream()
                .map(com.lms.course.dto.GradeResponseDto::fromEntity).toList();
    }

    public com.lms.course.dto.GradeResponseDto saveGrade(com.lms.course.dto.GradeRequestDto dto) {
        CModule module = moduleRepository.findById(dto.getModuleId()).orElse(null);
        if (module == null) {
            throw new NotFoundException("Module not found with id: " + dto.getModuleId());
        }

        // Check if grade already exists for this student and module (update instead of duplicate)
        com.lms.course.entity.Grade existing = gradeRepository.findByStudentIdAndModuleId(dto.getStudentId(), dto.getModuleId());
        if (existing != null) {
            existing.setScore(dto.getScore());
            existing.setComments(dto.getComments());
            // Auto-calculate letter grade
            existing.setGrade(calculateLetterGrade(dto.getScore()));
            return com.lms.course.dto.GradeResponseDto.fromEntity(gradeRepository.save(existing));
        }

        com.lms.course.entity.Grade grade = new com.lms.course.entity.Grade();
        grade.setStudentId(dto.getStudentId());
        grade.setModule(module);
        grade.setScore(dto.getScore());
        grade.setComments(dto.getComments());
        grade.setGrade(calculateLetterGrade(dto.getScore()));
        return com.lms.course.dto.GradeResponseDto.fromEntity(gradeRepository.save(grade));
    }

    private String calculateLetterGrade(Double score) {
        if (score == null) return null;
        if (score >= 16) return "A";
        if (score >= 14) return "B+";
        if (score >= 12) return "B";
        if (score >= 10) return "C";
        if (score >= 8) return "D";
        return "F";
    }

    public List<com.lms.course.entity.Assignment> getAssignmentsByModuleId(Long moduleId) {
        CModule module = moduleRepository.findById(moduleId).orElse(null);
        if (module == null) throw new NotFoundException("Module not found");
        return assignmentRepository.findByModule(module);
    }

    public com.lms.course.entity.Assignment createAssignment(com.lms.course.entity.Assignment assignment) {
        return assignmentRepository.save(assignment);
    }

    @org.springframework.transaction.annotation.Transactional
    public String deleteAssignment(Long id) {
        com.lms.course.entity.Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Assignment not found with id: " + id));
        // Delete questions first (with their options and adaptive_session_results)
        if (assignment.getQuestions() != null && !assignment.getQuestions().isEmpty()) {
            for (com.lms.course.entity.Question question : assignment.getQuestions()) {
                // Delete adaptive_session_results that reference this question
                List<com.lms.course.entity.AdaptiveSessionResult> adaptiveResults = adaptiveSessionResultRepository.findByQuestion(question);
                if (!adaptiveResults.isEmpty()) {
                    adaptiveSessionResultRepository.deleteAll(adaptiveResults);
                    adaptiveSessionResultRepository.flush();
                }
                // Delete question options (cascade should handle this, but explicit to be safe)
                if (question.getOptions() != null && !question.getOptions().isEmpty()) {
                    questionOptionRepository.deleteAll(question.getOptions());
                    questionOptionRepository.flush();
                }
            }
            // Delete questions
            questionRepository.deleteAll(assignment.getQuestions());
            questionRepository.flush();
        }
        assignmentRepository.delete(assignment);
        return "Assignment deleted successfully";
    }

    @org.springframework.transaction.annotation.Transactional
    public com.lms.course.entity.Assignment createAssignmentFromDto(com.lms.course.dto.AssignmentCreateDto dto) {
        CModule module = moduleRepository.findById(dto.getModuleId())
                .orElseThrow(() -> new NotFoundException("Module not found with id: " + dto.getModuleId()));

        com.lms.course.entity.Assignment assignment = new com.lms.course.entity.Assignment();
        assignment.setTitle(dto.getTitle());
        assignment.setDescription(dto.getDescription());
        assignment.setDueDate(dto.getDueDate());
        assignment.setMaxScore(dto.getMaxScore());
        assignment.setIsAiGenerated(dto.getIsAiGenerated());
        assignment.setTimeLimit(dto.getTimeLimit());
        assignment.setStrictIntegrityMode(dto.getStrictIntegrityMode());
        assignment.setModule(module);

        if (dto.getQuestions() != null) {
            double totalPoints = dto.getQuestions().stream()
                    .filter(q -> q.getPoints() != null)
                    .mapToDouble(com.lms.course.dto.QuestionCreateDto::getPoints)
                    .sum();
            if (dto.getMaxScore() != null && totalPoints != dto.getMaxScore()) {
                throw new IllegalArgumentException("La somme des points des questions (" + totalPoints + ") ne correspond pas au score maximum du devoir (" + dto.getMaxScore() + ")");
            }
            buildQuestionsForAssignment(assignment, dto.getQuestions());
        }

        com.lms.course.entity.Assignment saved = assignmentRepository.save(assignment);

        // Notify students
        notifyStudents(assignment.getModule(),
            "Nouveau devoir : " + saved.getTitle(),
            "Un nouveau devoir a été publié dans le module " + assignment.getModule().getName(),
            "QUIZ");

        return saved;
    }

    public com.lms.course.entity.Assignment getAssignmentById(Long id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Assignment not found with id: " + id));
    }

    @org.springframework.transaction.annotation.Transactional
    public com.lms.course.entity.Assignment updateAssignmentFromDto(Long id, com.lms.course.dto.AssignmentCreateDto dto) {
        com.lms.course.entity.Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Assignment not found with id: " + id));

        assignment.setTitle(dto.getTitle());
        assignment.setDescription(dto.getDescription());
        assignment.setDueDate(dto.getDueDate());
        assignment.setMaxScore(dto.getMaxScore());
        assignment.setTimeLimit(dto.getTimeLimit());
        assignment.setStrictIntegrityMode(dto.getStrictIntegrityMode());
        
        if (dto.getModuleId() != null) {
            CModule module = moduleRepository.findById(dto.getModuleId())
                    .orElseThrow(() -> new NotFoundException("Module not found with id: " + dto.getModuleId()));
            assignment.setModule(module);
        }

        if (dto.getQuestions() != null) {
            double totalPoints = dto.getQuestions().stream()
                    .filter(q -> q.getPoints() != null)
                    .mapToDouble(com.lms.course.dto.QuestionCreateDto::getPoints)
                    .sum();
            if (dto.getMaxScore() != null && Math.abs(totalPoints - dto.getMaxScore()) > 0.01) {
                throw new IllegalArgumentException("La somme des points des questions (" + totalPoints + ") ne correspond pas au score maximum du devoir (" + dto.getMaxScore() + ")");
            }
            
            // Clear existing questions to rebuild (orphanRemoval will delete them)
            assignment.getQuestions().clear();
            buildQuestionsForAssignment(assignment, dto.getQuestions());
        }

        return assignmentRepository.save(assignment);
    }

    private void buildQuestionsForAssignment(com.lms.course.entity.Assignment assignment, java.util.List<com.lms.course.dto.QuestionCreateDto> questionDtos) {
        java.util.List<com.lms.course.entity.Question> questions = questionDtos.stream().map(qDto -> {
            com.lms.course.entity.Question question = new com.lms.course.entity.Question();
            question.setText(qDto.getText());
            question.setHint(qDto.getHint());
            question.setJustification(qDto.getJustification());
            question.setOrderIndex(qDto.getOrderIndex());
            question.setPoints(qDto.getPoints());
            question.setType(qDto.getType());
            question.setCompetence(qDto.getCompetence());
            question.setAssignment(assignment);

            if (qDto.getOptions() != null) {
                java.util.List<com.lms.course.entity.QuestionOption> options = qDto.getOptions().stream().map(oDto -> {
                    com.lms.course.entity.QuestionOption option = new com.lms.course.entity.QuestionOption();
                    option.setText(oDto.getText());
                    option.setCorrect(oDto.getCorrect());
                    option.setQuestion(question);
                    return option;
                }).collect(java.util.stream.Collectors.toList());
                question.setOptions(options);
            }
            return question;
        }).collect(java.util.stream.Collectors.toList());

        assignment.setQuestions(questions);
    }

    public List<com.lms.course.entity.Submission> getSubmissionsByAssignmentId(Long assignmentId) {
        com.lms.course.entity.Assignment assignment = assignmentRepository.findById(assignmentId).orElse(null);
        if (assignment == null) throw new NotFoundException("Assignment not found");
        return submissionRepository.findByAssignment(assignment);
    }

    public com.lms.course.entity.Submission submitAssignment(com.lms.course.entity.Submission submission) {
        return submissionRepository.save(submission);
    }

    @org.springframework.transaction.annotation.Transactional
    public com.lms.course.dto.AssignmentSubmissionResultDto submitAssignmentFromDto(com.lms.course.dto.AssignmentSubmissionDto submissionDto) {
        // 1. Retrieve assignment
        com.lms.course.entity.Assignment assignment = assignmentRepository.findById(submissionDto.getAssignmentId())
                .orElseThrow(() -> new NotFoundException("Devoir introuvable : " + submissionDto.getAssignmentId()));

        // 2. Create Submission entity
        com.lms.course.entity.Submission submission = new com.lms.course.entity.Submission();
        submission.setAssignment(assignment);
        submission.setStudentId(submissionDto.getStudentUsername());
        com.lms.course.entity.Submission savedSubmission = submissionRepository.save(submission);

        // 3. Evaluate each answer
        double totalScore = 0.0;
        java.util.List<com.lms.course.entity.StudentAnswer> evaluatedAnswers = new java.util.ArrayList<>();

        java.util.List<com.lms.course.dto.StudentAnswerDto> answerDtoList =
                submissionDto.getAnswers() != null ? submissionDto.getAnswers() : new java.util.ArrayList<>();

        for (com.lms.course.dto.StudentAnswerDto answerDto : answerDtoList) {
            if (answerDto.getQuestionId() == null) continue;
            com.lms.course.entity.Question question = questionRepository.findById(answerDto.getQuestionId())
                    .orElse(null);
            if (question == null) continue;

            com.lms.course.entity.StudentAnswer studentAnswer = new com.lms.course.entity.StudentAnswer();
            studentAnswer.setQuestion(question);
            studentAnswer.setSubmission(savedSubmission);

            if (question.getType() == com.lms.course.entity.Question.QuestionType.ESSAY || 
                question.getType() == com.lms.course.entity.Question.QuestionType.SHORT_ANSWER) {
                
                studentAnswer.setTextAnswer(answerDto.getTextAnswer());
                // Check if answer is completely empty
                String textAnswer = answerDto.getTextAnswer();
                if (textAnswer == null || textAnswer.trim().isEmpty()) {
                    studentAnswer.setScoreAwarded(0.0);
                    studentAnswer.setAiFeedback("L'étudiant n'a fourni aucune réponse.");
                    studentAnswer.setIsCorrect(false);
                } else {
                    // Call AI to evaluate
                    try {
                        com.lms.course.dto.EvaluateAnswerRequest evalRequest = new com.lms.course.dto.EvaluateAnswerRequest(
                                question.getText(),
                                question.getJustification() != null ? question.getJustification() : "",
                                textAnswer,
                                question.getPoints() != null ? question.getPoints().doubleValue() : 0.0
                        );
                        com.lms.course.dto.EvaluateAnswerResponse evalResponse = aiClient.evaluateAnswer(evalRequest);
                        studentAnswer.setScoreAwarded(evalResponse.getScoreAwarded());
                        studentAnswer.setAiFeedback(evalResponse.getFeedback());
                        totalScore += evalResponse.getScoreAwarded() != null ? evalResponse.getScoreAwarded() : 0.0;
                        studentAnswer.setIsCorrect(evalResponse.getScoreAwarded() != null && evalResponse.getScoreAwarded() > 0);
                    } catch (Exception e) {
                        studentAnswer.setScoreAwarded(0.0);
                        studentAnswer.setAiFeedback("Évaluation automatique indisponible.");
                        studentAnswer.setIsCorrect(false);
                    }
                }
            } else {
                // QCM / TRUE_FALSE Evaluation
                java.util.List<Long> selectedOptionIds = new java.util.ArrayList<>();
                if (answerDto.getSelectedOptionIds() != null) {
                    selectedOptionIds.addAll(answerDto.getSelectedOptionIds());
                }
                if (answerDto.getSelectedOptionId() != null && !selectedOptionIds.contains(answerDto.getSelectedOptionId())) {
                    selectedOptionIds.add(answerDto.getSelectedOptionId());
                }
                
                java.util.List<com.lms.course.entity.QuestionOption> selectedOptions = new java.util.ArrayList<>();
                
                for (Long optId : selectedOptionIds) {
                    questionOptionRepository.findById(optId).ifPresent(selectedOptions::add);
                }
                
                studentAnswer.setSelectedOptions(selectedOptions);
                
                // Compare with correct options
                java.util.List<com.lms.course.entity.QuestionOption> allOptions = question.getOptions();
                java.util.List<Long> correctOptionIds = new java.util.ArrayList<>();
                if (allOptions != null) {
                    correctOptionIds = allOptions.stream()
                            .filter(com.lms.course.entity.QuestionOption::isCorrect)
                            .map(com.lms.course.entity.QuestionOption::getId)
                            .collect(java.util.stream.Collectors.toList());
                }
                
                boolean isCorrect = false;
                if (selectedOptionIds != null && selectedOptionIds.size() == correctOptionIds.size() && 
                    selectedOptionIds.containsAll(correctOptionIds)) {
                    isCorrect = true;
                }
                
                studentAnswer.setIsCorrect(isCorrect);
                double points = isCorrect ? (question.getPoints() != null ? question.getPoints().doubleValue() : 0.0) : 0.0;
                studentAnswer.setScoreAwarded(points);
                totalScore += points;
                
                // Ne pas définir de aiFeedback pour les QCM (l'IA n'évalue que les questions ouvertes)
                studentAnswer.setAiFeedback(null);
            }

            evaluatedAnswers.add(studentAnswerRepository.save(studentAnswer));
        }

        // 4. Update submission with final score
        savedSubmission.setScore(totalScore);
        savedSubmission.setAnswers(evaluatedAnswers);

        com.lms.course.entity.Submission finalSubmission = submissionRepository.save(savedSubmission);

        if (submissionDto.getIntegrityReport() != null) {
            com.lms.course.dto.IntegrityReportDto irDto = submissionDto.getIntegrityReport();
            com.lms.course.entity.IntegrityReport integrityReport = new com.lms.course.entity.IntegrityReport();
            integrityReport.setSubmission(finalSubmission);
            integrityReport.setMouseExitCount(irDto.getMouseExitCount());
            integrityReport.setTabSwitchCount(irDto.getTabSwitchCount());
            integrityReport.setAutoSubmitted(irDto.getAutoSubmitted());
            integrityReport.setNotes(irDto.getNotes());

            int integrityScore = 100;
            if (irDto.getMouseExitCount() != null) integrityScore -= irDto.getMouseExitCount() * 5;
            if (irDto.getTabSwitchCount() != null) integrityScore -= irDto.getTabSwitchCount() * 10;
            if (Boolean.TRUE.equals(irDto.getAutoSubmitted())) integrityScore -= 30;
            integrityReport.setIntegrityScore(Math.max(0, integrityScore));

            integrityReportRepository.save(integrityReport);
        }
        return buildSubmissionResultDto(finalSubmission);
    }

    private com.lms.course.dto.AssignmentSubmissionResultDto buildSubmissionResultDto(com.lms.course.entity.Submission submission) {
        com.lms.course.dto.AssignmentSubmissionResultDto dto = new com.lms.course.dto.AssignmentSubmissionResultDto();
        dto.setId(submission.getId());
        dto.setScore(submission.getScore());
        dto.setSubmissionDate(submission.getSubmissionDate());
        dto.setFeedback(submission.getFeedback());

        java.util.List<com.lms.course.dto.AssignmentSubmissionResultDto.AnswerResultDto> answerDtos = new java.util.ArrayList<>();
        if (submission.getAnswers() != null) {
            for (com.lms.course.entity.StudentAnswer sa : submission.getAnswers()) {
                com.lms.course.dto.AssignmentSubmissionResultDto.AnswerResultDto aDto =
                        new com.lms.course.dto.AssignmentSubmissionResultDto.AnswerResultDto();
                aDto.setQuestionId(sa.getQuestion() != null ? sa.getQuestion().getId() : null);
                aDto.setTextAnswer(sa.getTextAnswer());
                aDto.setScoreAwarded(sa.getScoreAwarded());
                aDto.setAiFeedback(sa.getAiFeedback());
                aDto.setIsCorrect(sa.getIsCorrect());
                if (sa.getSelectedOptions() != null) {
                    aDto.setSelectedOptions(sa.getSelectedOptions().stream()
                            .map(o -> new com.lms.course.dto.AssignmentSubmissionResultDto.OptionDto(o.getId(), o.getText()))
                            .collect(java.util.stream.Collectors.toList()));
                }
                answerDtos.add(aDto);
            }
        }
        dto.setAnswers(answerDtos);
        return dto;
    }

    public List<com.lms.course.entity.Submission> getSubmissionsByStudentId(String studentId) {
        return submissionRepository.findByStudentId(studentId);
    }

    public List<com.lms.course.entity.Attendance> getAttendanceByModuleAndDate(Long moduleId, java.time.LocalDate date) {
        CModule module = moduleRepository.findById(moduleId).orElse(null);
        if (module == null) throw new NotFoundException("Module not found");
        return attendanceRepository.findByModuleAndDate(module, date);
    }

    public com.lms.course.entity.Attendance saveAttendance(com.lms.course.entity.Attendance attendance) {
        return attendanceRepository.save(attendance);
    }

    public List<com.lms.course.entity.Attendance> getAttendanceByStudentId(String studentId) {
        return attendanceRepository.findByStudentId(studentId);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<com.lms.course.dto.QuizResponseDto> getQuizzesByModuleId(Long moduleId) {
        return quizRepository.findByModuleId(moduleId).stream()
                .map(com.lms.course.dto.QuizResponseDto::fromEntity).toList();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public com.lms.course.dto.QuizDetailDto getQuizById(Long id) {
        com.lms.course.entity.Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Quiz not found with id: " + id));
        return com.lms.course.dto.QuizDetailDto.fromEntity(quiz, false);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public com.lms.course.dto.QuizDetailDto getQuizForStudent(Long id) {
        com.lms.course.entity.Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Quiz not found with id: " + id));
        return com.lms.course.dto.QuizDetailDto.fromEntity(quiz, true);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public java.util.List<com.lms.course.dto.QuizResultSummaryDto> getQuizResultsByStudentId(String studentId) {
        java.util.List<com.lms.course.dto.QuizResultSummaryDto> allResults = new java.util.ArrayList<>();
        
        java.util.List<com.lms.course.entity.QuizResult> qrList = quizResultRepository.findByStudentId(studentId);
        for (com.lms.course.entity.QuizResult qr : qrList) {
            allResults.add(com.lms.course.dto.QuizResultSummaryDto.fromEntity(qr));
        }
        
        java.util.List<com.lms.course.entity.Submission> subList = submissionRepository.findByStudentId(studentId);
        for (com.lms.course.entity.Submission sub : subList) {
            allResults.add(com.lms.course.dto.QuizResultSummaryDto.fromSubmission(sub));
        }
        
        allResults.sort((a, b) -> {
            if (a.getCompletedDate() == null && b.getCompletedDate() == null) return 0;
            if (a.getCompletedDate() == null) return 1;
            if (b.getCompletedDate() == null) return -1;
            return b.getCompletedDate().compareTo(a.getCompletedDate());
        });
        
        return allResults;
    }

    public com.lms.course.entity.Submission getSubmissionById(Long id) {
        return submissionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Submission not found"));
    }

    public com.lms.course.dto.QuizResponseDto createQuizFromDto(com.lms.course.dto.QuizCreateDto dto) {
        CModule module = moduleRepository.findById(dto.getModuleId())
                .orElseThrow(() -> new NotFoundException("Module not found with id: " + dto.getModuleId()));

        if (quizRepository.existsByTitleAndModuleId(dto.getTitle(), dto.getModuleId())) {
            throw new RuntimeException("A quiz with the same title already exists in this module");
        }

        com.lms.course.entity.Quiz quiz = new com.lms.course.entity.Quiz();
        applyQuizFields(quiz, dto);
        quiz.setModule(module);
        buildQuestions(quiz, dto.getQuestions());

        com.lms.course.entity.Quiz savedQuiz = quizRepository.save(quiz);

        // Notify students
        notifyStudents(quiz.getModule(),
            "Nouveau quiz : " + savedQuiz.getTitle(),
            "Un nouveau quiz a été publié dans le module " + quiz.getModule().getName(),
            "QUIZ");

        return com.lms.course.dto.QuizResponseDto.fromEntity(savedQuiz);
    }

    @org.springframework.transaction.annotation.Transactional
    public com.lms.course.dto.QuizResponseDto updateQuiz(Long id, com.lms.course.dto.QuizCreateDto dto) {
        com.lms.course.entity.Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Quiz not found with id: " + id));

        applyQuizFields(quiz, dto);

        // Replace questions only if provided AND no submissions exist
        if (dto.getQuestions() != null) {
            boolean hasResults = !quizResultRepository.findByQuiz(quiz).isEmpty();
            if (hasResults) {
                throw new ConflictException("Cannot update questions: quiz already has student submissions. Only metadata can be updated.");
            }
            if (quiz.getQuestions() != null) {
                quiz.getQuestions().clear();
            }
            buildQuestions(quiz, dto.getQuestions());
        }

        return com.lms.course.dto.QuizResponseDto.fromEntity(quizRepository.save(quiz));
    }

    @jakarta.transaction.Transactional
    public String deleteQuiz(Long id) {
        com.lms.course.entity.Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Quiz not found with id: " + id));
        // Delete quiz results first (student_answers reference question_options via FK)
        List<com.lms.course.entity.QuizResult> results = quizResultRepository.findByQuiz(quiz);
        if (!results.isEmpty()) {
            quizResultRepository.deleteAll(results);
            quizResultRepository.flush();
        }
        // Delete adaptive session results (reference questions via FK)
        List<com.lms.course.entity.Question> questions = questionRepository.findByQuiz(quiz);
        for (com.lms.course.entity.Question question : questions) {
            List<com.lms.course.entity.AdaptiveSessionResult> adaptiveResults = adaptiveSessionResultRepository.findByQuestion(question);
            if (!adaptiveResults.isEmpty()) {
                adaptiveSessionResultRepository.deleteAll(adaptiveResults);
                adaptiveSessionResultRepository.flush();
            }
        }
        // Delete questions explicitly (with their options via cascade)
        if (!questions.isEmpty()) {
            questionRepository.deleteAll(questions);
            questionRepository.flush();
        }
        quizRepository.delete(quiz);
        return "Quiz deleted successfully";
    }

    private void applyQuizFields(com.lms.course.entity.Quiz quiz, com.lms.course.dto.QuizCreateDto dto) {
        if (dto.getTitle() != null) quiz.setTitle(dto.getTitle());
        if (dto.getDescription() != null) quiz.setDescription(dto.getDescription());
        if (dto.getTimeLimit() != null) quiz.setTimeLimit(dto.getTimeLimit());
        if (dto.getTimeLimitPerQuestion() != null) quiz.setTimeLimitPerQuestion(dto.getTimeLimitPerQuestion());
        if (dto.getTypeQuiz() != null) quiz.setTypeQuiz(dto.getTypeQuiz());
        if (dto.getDocumentMode() != null) quiz.setDocumentMode(dto.getDocumentMode());
        if (dto.getCameraSurveillanceEnabled() != null) quiz.setCameraSurveillanceEnabled(dto.getCameraSurveillanceEnabled());
        if (dto.getRandomizeQuestions() != null) quiz.setRandomizeQuestions(dto.getRandomizeQuestions());
        if (dto.getRandomizeAnswers() != null) quiz.setRandomizeAnswers(dto.getRandomizeAnswers());
        if (dto.getMaxAttempts() != null) quiz.setMaxAttempts(dto.getMaxAttempts());
        if (dto.getPublishDate() != null) quiz.setPublishDate(dto.getPublishDate());
        if (dto.getDueDate() != null) quiz.setDueDate(dto.getDueDate());
        if (dto.getIsDraft() != null) quiz.setIsDraft(dto.getIsDraft());
        if (dto.getPassingScore() != null) quiz.setPassingScore(dto.getPassingScore());
    }

    private void buildQuestions(com.lms.course.entity.Quiz quiz, List<com.lms.course.dto.QuestionCreateDto> questionDtos) {
        if (questionDtos == null) return;
        List<com.lms.course.entity.Question> questions = questionDtos.stream().map(qDto -> {
            com.lms.course.entity.Question question = new com.lms.course.entity.Question();
            question.setText(qDto.getText());
            question.setHint(qDto.getHint());
            question.setJustification(qDto.getJustification());
            question.setOrderIndex(qDto.getOrderIndex());
            question.setPoints(qDto.getPoints());
            question.setType(qDto.getType());
            question.setCompetence(qDto.getCompetence());
            question.setQuiz(quiz);

            if (qDto.getOptions() != null) {
                List<com.lms.course.entity.QuestionOption> options = qDto.getOptions().stream().map(oDto -> {
                    com.lms.course.entity.QuestionOption option = new com.lms.course.entity.QuestionOption();
                    option.setText(oDto.getText());
                    option.setCorrect(oDto.getCorrect());
                    option.setQuestion(question);
                    return option;
                }).collect(java.util.stream.Collectors.toList());
                question.setOptions(options);
            }
            return question;
        }).collect(java.util.stream.Collectors.toList());

        if (quiz.getQuestions() == null) {
            quiz.setQuestions(questions);
        } else {
            quiz.getQuestions().addAll(questions);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public com.lms.course.dto.QuizResultDetailDto submitQuiz(com.lms.course.dto.QuizSubmissionDto dto) {
        com.lms.course.entity.Quiz quiz = quizRepository.findById(dto.getQuizId())
                .orElseThrow(() -> new NotFoundException("Quiz not found"));

        long attemptCount = quizResultRepository.countByQuizAndStudentId(quiz, dto.getStudentId());

        com.lms.course.entity.QuizResult result = new com.lms.course.entity.QuizResult();
        result.setQuiz(quiz);
        result.setStudentId(dto.getStudentId());
        result.setAttemptNumber((int) (attemptCount + 1));
        result.setCompletedDate(java.time.LocalDateTime.now());
        
        result = quizResultRepository.save(result);

        int totalPoints = 0;
        int earnedPoints = 0;

        List<com.lms.course.entity.StudentAnswer> studentAnswers = new java.util.ArrayList<>();
        if (quiz.getQuestions() == null || quiz.getQuestions().isEmpty()) {
            throw new NotFoundException("Quiz has no questions");
        }
        for (com.lms.course.dto.StudentAnswerDto answerDto : dto.getAnswers()) {
            com.lms.course.entity.Question question = quiz.getQuestions().stream()
                    .filter(q -> q.getId().equals(answerDto.getQuestionId()))
                    .findFirst()
                    .orElse(null);

            if (question == null) continue;

            com.lms.course.entity.StudentAnswer studentAnswer = new com.lms.course.entity.StudentAnswer();
            studentAnswer.setQuizResult(result);
            studentAnswer.setQuestion(question);
            studentAnswer.setTextAnswer(answerDto.getTextAnswer());

            if (answerDto.getSelectedOptionId() != null) {
                com.lms.course.entity.QuestionOption selectedOption = question.getOptions().stream()
                        .filter(o -> o.getId().equals(answerDto.getSelectedOptionId()))
                        .findFirst()
                        .orElse(null);
                studentAnswer.setSelectedOption(selectedOption);
                studentAnswer.setIsCorrect(selectedOption != null && selectedOption.isCorrect());
            } else {
                studentAnswer.setIsCorrect(false);
            }

            studentAnswers.add(studentAnswerRepository.save(studentAnswer));

            if (Boolean.FALSE.equals(studentAnswer.getIsCorrect()) && question.getCompetence() != null && quiz.getModule() != null) {
                try {
                    String comp = question.getCompetence();
                    Long moduleId = quiz.getModule().getId();
                    if (moduleId == null) {
                        System.err.println("Module ID is null for quiz: " + quiz.getId());
                        continue;
                    }
                    java.util.Optional<com.lms.course.entity.Lacune> existing = lacuneRepository.findByStudentIdAndModuleIdAndCompetence(dto.getStudentId(), moduleId, comp);
                    if (existing.isEmpty()) {
                        com.lms.course.entity.Lacune lacune = new com.lms.course.entity.Lacune();
                        lacune.setStudentId(dto.getStudentId());
                        lacune.setModuleId(quiz.getModule().getId());
                        lacune.setCompetence(comp);
                        lacune.setNiveau("FAIBLE");
                        lacuneRepository.save(lacune);
                    }
                } catch (Exception e) {
                    System.err.println("Failed to record lacune: " + e.getMessage());
                }
            }

            if (question.getPoints() != null) {
                totalPoints += question.getPoints();
                if (Boolean.TRUE.equals(studentAnswer.getIsCorrect())) {
                    earnedPoints += question.getPoints();
                }
            }
        }

        result.setAnswers(studentAnswers);

        if (totalPoints > 0) {
            double scorePercentage = (double) earnedPoints / totalPoints * 100;
            result.setScore(scorePercentage);
            
            Double passingThreshold = quiz.getPassingScore();
            if (passingThreshold != null && passingThreshold <= 20) {
                passingThreshold = passingThreshold * 5;
            }
            result.setPassed(passingThreshold != null && scorePercentage >= passingThreshold);

            try {
                String amount = (result.getPassed() != null && result.getPassed()) ? "50" : "10";
                restTemplate.postForObject("http://user-service/api/user/gamification/" + dto.getStudentId() + "/xp?amount=" + amount, null, String.class);
            } catch (Exception e) {
                System.err.println("XP Award failed: " + e.getMessage());
            }

            try {
                java.util.Map<String, Object> notif = new java.util.HashMap<>();
                notif.put("userId", dto.getStudentId());
                boolean passed = Boolean.TRUE.equals(result.getPassed());
                notif.put("title", passed ? "Quiz réussi : " + quiz.getTitle() : "Quiz terminé : " + quiz.getTitle());
                notif.put("content", String.format("Score : %.1f%% %s", result.getScore(), passed ? " Bravo !" : " Continuez vos efforts."));
                notif.put("type", "QUIZ");
                restTemplate.postForObject("http://announcement-service/api/announcement/notifications/send", notif, Object.class);
            } catch (Exception e) {
                System.err.println("Notification failed: " + e.getMessage());
            }
        } else {
            result.setScore(0.0);
            result.setPassed(false);
        }

        if (dto.getIntegrityReport() != null) {
            com.lms.course.entity.IntegrityReport integrityReport = new com.lms.course.entity.IntegrityReport();
            integrityReport.setQuizResult(result);
            integrityReport.setMouseExitCount(dto.getIntegrityReport().getMouseExitCount());
            integrityReport.setTabSwitchCount(dto.getIntegrityReport().getTabSwitchCount());
            integrityReport.setAutoSubmitted(dto.getIntegrityReport().getAutoSubmitted());
            integrityReport.setSuspiciousVideoSegments(dto.getIntegrityReport().getSuspiciousVideoSegments());
            integrityReport.setNotes(dto.getIntegrityReport().getNotes());
            int integrityScore = 100;
            if (dto.getIntegrityReport().getMouseExitCount() != null) integrityScore -= dto.getIntegrityReport().getMouseExitCount() * 5;
            if (dto.getIntegrityReport().getTabSwitchCount() != null) integrityScore -= dto.getIntegrityReport().getTabSwitchCount() * 10;
            if (Boolean.TRUE.equals(dto.getIntegrityReport().getAutoSubmitted())) integrityScore -= 30;
            integrityReport.setIntegrityScore(Math.max(0, integrityScore));
            result.setIntegrityReport(integrityReport);
        }

        try {
            if (quiz.getModule() != null && quiz.getModule().getId() != null) {
                java.util.Map<String, Integer> wrongByCompetence = new java.util.HashMap<>();
                java.util.Map<String, Integer> correctByCompetence = new java.util.HashMap<>();
                java.util.Map<String, Integer> totalByCompetence = new java.util.HashMap<>();
                if (quiz.getQuestions() != null) {
                    for (com.lms.course.entity.Question q : quiz.getQuestions()) {
                        if (q.getCompetence() != null && !q.getCompetence().isBlank()) totalByCompetence.merge(q.getCompetence(), 1, Integer::sum);
                    }
                }
                for (com.lms.course.entity.StudentAnswer sa : studentAnswers) {
                    if (sa.getQuestion() != null) {
                        String comp = sa.getQuestion().getCompetence();
                        if (comp != null && !comp.isBlank()) {
                            if (Boolean.FALSE.equals(sa.getIsCorrect())) {
                                wrongByCompetence.merge(comp, 1, Integer::sum);
                            } else {
                                correctByCompetence.merge(comp, 1, Integer::sum);
                            }
                        }
                    }
                }
                Long moduleId = quiz.getModule().getId();
                
                // 1. Award skill-specific XP for correct answers
                for (java.util.Map.Entry<String, Integer> entry : correctByCompetence.entrySet()) {
                    String competence = entry.getKey();
                    int correctCount = entry.getValue();
                    int xpToAward = correctCount * 10;
                    try {
                        restTemplate.postForObject("http://user-service/api/user/gamification/" + dto.getStudentId() + "/xp?amount=" + xpToAward + "&skill=" + competence, null, String.class);
                    } catch (Exception e) {
                        System.err.println("Skill XP Award failed for " + competence + ": " + e.getMessage());
                    }
                }

                // 2. Track new lacunes if error rate is high (>= 70%)
                for (java.util.Map.Entry<String, Integer> entry : wrongByCompetence.entrySet()) {
                    String competence = entry.getKey();
                    int wrong = entry.getValue();
                    int total = totalByCompetence.getOrDefault(competence, 1);
                    double errorRate = (double) wrong / total;
                    if (errorRate >= 0.7) {
                        String niveau = errorRate >= 0.9 ? "FAIBLE" : "MOYEN";
                        java.util.Optional<com.lms.course.entity.Lacune> existingLacune = lacuneRepository.findByStudentIdAndModuleIdAndCompetence(dto.getStudentId(), moduleId, competence);
                        if (existingLacune.isEmpty()) {
                            com.lms.course.entity.Lacune lacune = new com.lms.course.entity.Lacune();
                            lacune.setStudentId(dto.getStudentId());
                            lacune.setModuleId(moduleId);
                            lacune.setCompetence(competence);
                            lacune.setNiveau(niveau);
                            lacuneRepository.save(lacune);
                        } else {
                            com.lms.course.entity.Lacune existing = existingLacune.get();
                            existing.setNiveau(niveau);
                            lacuneRepository.save(existing);
                        }
                    }
                }

                // 3. Clear resolved lacunes if success rate is high (>= 60%)
                for (java.util.Map.Entry<String, Integer> entry : correctByCompetence.entrySet()) {
                    String competence = entry.getKey();
                    int correct = entry.getValue();
                    int total = totalByCompetence.getOrDefault(competence, 1);
                    double successRate = (double) correct / total;
                    if (successRate >= 0.6) {
                        java.util.Optional<com.lms.course.entity.Lacune> existingLacune = lacuneRepository.findByStudentIdAndModuleIdAndCompetence(dto.getStudentId(), moduleId, competence);
                        if (existingLacune.isPresent()) {
                            lacuneRepository.delete(existingLacune.get());
                        }
                    }
                }

                // 4. Update student's AdaptiveProfile in user-service
                try {
                    java.util.List<com.lms.course.entity.Lacune> allLacunes = lacuneRepository.findByStudentId(dto.getStudentId());
                    java.util.Map<String, String> competencesMap = new java.util.LinkedHashMap<>();
                    
                    // Add all remaining unresolved lacunes
                    for (com.lms.course.entity.Lacune l : allLacunes) {
                        if (l.getCompetence() != null) competencesMap.put(l.getCompetence(), l.getNiveau());
                    }
                    
                    // Add newly validated skills as BON or EXCELLENT
                    for (java.util.Map.Entry<String, Integer> entry : correctByCompetence.entrySet()) {
                        String competence = entry.getKey();
                        int correct = entry.getValue();
                        int total = totalByCompetence.getOrDefault(competence, 1);
                        double successRate = (double) correct / total;
                        if (successRate >= 0.6) {
                            String niveau = successRate >= 0.85 ? "EXCELLENT" : "BON";
                            competencesMap.put(competence, niveau);
                        }
                    }
                    
                    long faibleCount = competencesMap.values().stream().filter("FAIBLE"::equals).count();
                    long excellentCount = competencesMap.values().stream().filter("EXCELLENT"::equals).count();
                    String niveauGlobal = faibleCount >= 2 ? "DEBUTANT" : (excellentCount >= 2 ? "AVANCE" : "INTERMEDIAIRE");
                    
                    java.util.Map<String, Object> adaptiveData = new java.util.HashMap<>();
                    adaptiveData.put("competences", competencesMap);
                    adaptiveData.put("niveauGlobal", niveauGlobal);
                    
                    try {
                        restTemplate.postForObject("http://user-service/api/user/analytics/student/" + dto.getStudentId() + "/profil-adaptatif", adaptiveData, Object.class);
                    } catch (Exception e) {
                        System.err.println("Adaptive update failed: " + e.getMessage());
                    }
                    
                    // Generate AI recommended course remediation for high error rate competencies
                    String moduleName = quiz.getModule().getName() != null ? quiz.getModule().getName() : "ce module";
                    for (java.util.Map.Entry<String, Integer> e2 : wrongByCompetence.entrySet()) {
                        String comp2 = e2.getKey();
                        int wrong = e2.getValue();
                        int total = totalByCompetence.getOrDefault(comp2, 1);
                        double errorRate = (double) wrong / total;
                        if (errorRate >= 0.7) {
                            String niv2 = errorRate >= 0.9 ? "FAIBLE" : "MOYEN";
                            java.util.Map<String, Object> reco = new java.util.HashMap<>();
                            reco.put("typeReco", "MODULE");
                            reco.put("cibleId", String.valueOf(moduleId));
                            reco.put("raison", "Lacune " + niv2 + " en \"" + comp2 + "\" - quiz : \"" + quiz.getTitle() + "\". Révisez les supports de " + moduleName + ".");
                            try {
                                restTemplate.postForObject("http://user-service/api/user/analytics/student/" + dto.getStudentId() + "/recommandations", reco, Object.class);
                            } catch (Exception recoEx) {
                                System.err.println("Reco failed: " + recoEx.getMessage());
                            }
                        }
                    }
                } catch (Exception adaptiveEx) {
                    System.err.println("Adaptive profile failed: " + adaptiveEx.getMessage());
                }
            }
        } catch (Exception lacuneEx) {
            System.err.println("Lacunes failed: " + lacuneEx.getMessage());
        }

        result = quizResultRepository.save(result);
        return buildQuizResultDetail(result);
    }

    public List<com.lms.course.entity.QuizResult> getQuizResultsByQuizId(Long quizId) {
        com.lms.course.entity.Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new NotFoundException("Quiz not found"));
        return quizResultRepository.findByQuiz(quiz);
    }

    @org.springframework.transaction.annotation.Transactional
    public com.lms.course.dto.QuizResultDetailDto submitQuizWithDetails(com.lms.course.dto.QuizSubmissionDto dto) {
        return submitQuiz(dto);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public com.lms.course.dto.QuizResultDetailDto getQuizResultDetails(Long resultId) {
        com.lms.course.entity.QuizResult result = quizResultRepository.findById(resultId)
                .orElseThrow(() -> new NotFoundException("Quiz result not found"));
        return buildQuizResultDetail(result);
    }

    private com.lms.course.dto.QuizResultDetailDto buildQuizResultDetail(com.lms.course.entity.QuizResult result) {
        com.lms.course.entity.Quiz quiz = result.getQuiz();
        com.lms.course.dto.QuizResultDetailDto dto = new com.lms.course.dto.QuizResultDetailDto();
        dto.setId(result.getId());
        dto.setQuizId(quiz.getId());
        if (quiz.getModule() != null) {
            dto.setModuleId(quiz.getModule().getId());
        } else if (quiz.getCourse() != null && quiz.getCourse().getModule() != null) {
            dto.setModuleId(quiz.getCourse().getModule().getId());
        }
        dto.setQuizTitle(quiz.getTitle());
        dto.setStudentId(result.getStudentId());
        dto.setScore(result.getScore() != null ? result.getScore() : 0.0);
        if (result.getScore() != null) {
            dto.setScoreOnTwenty(Math.round((result.getScore() / 100.0 * 20.0) * 100.0) / 100.0);
        } else {
            dto.setScoreOnTwenty(0.0);
        }
        dto.setPassed(result.getPassed());
        dto.setPassingScore(quiz.getPassingScore());
        dto.setAttemptNumber(result.getAttemptNumber());
        dto.setMaxAttempts(quiz.getMaxAttempts());
        dto.setCompletedDate(result.getCompletedDate());

        // Map student answers by question id for quick lookup
        java.util.Map<Long, com.lms.course.entity.StudentAnswer> answerByQ = new java.util.HashMap<>();
        if (result.getAnswers() != null) {
            for (com.lms.course.entity.StudentAnswer sa : result.getAnswers()) {
                if (sa.getQuestion() != null) {
                    answerByQ.put(sa.getQuestion().getId(), sa);
                }
            }
        }

        java.util.List<com.lms.course.dto.QuizResultDetailDto.QuestionResultDto> qDtos = new java.util.ArrayList<>();
        if (quiz.getQuestions() != null) {
            for (com.lms.course.entity.Question q : quiz.getQuestions()) {
                com.lms.course.dto.QuizResultDetailDto.QuestionResultDto qDto =
                        new com.lms.course.dto.QuizResultDetailDto.QuestionResultDto();
                qDto.setQuestionId(q.getId());
                qDto.setText(q.getText());
                qDto.setHint(q.getHint());
                qDto.setJustification(q.getJustification());
                qDto.setPoints(q.getPoints());
                qDto.setType(q.getType() != null ? q.getType().name() : null);

                java.util.List<com.lms.course.dto.QuizResultDetailDto.OptionResultDto> opts = new java.util.ArrayList<>();
                if (q.getOptions() != null) {
                    for (com.lms.course.entity.QuestionOption o : q.getOptions()) {
                        opts.add(new com.lms.course.dto.QuizResultDetailDto.OptionResultDto(
                                o.getId(), o.getText(), o.isCorrect()));
                    }
                }
                qDto.setOptions(opts);

                com.lms.course.entity.StudentAnswer sa = answerByQ.get(q.getId());
                if (sa != null) {
                    qDto.setSelectedOptionId(sa.getSelectedOption() != null ? sa.getSelectedOption().getId() : null);
                    qDto.setTextAnswer(sa.getTextAnswer());
                    qDto.setIsCorrect(sa.getIsCorrect());
                    qDto.setAiFeedback(sa.getAiFeedback());
                    qDto.setScoreAwarded(sa.getScoreAwarded() != null ? sa.getScoreAwarded() : (sa.getIsCorrect() ? (q.getPoints() != null ? q.getPoints().doubleValue() : 0.0) : 0.0));
                }
                qDtos.add(qDto);
            }
        }
        dto.setQuestions(qDtos);
        return dto;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public com.lms.course.dto.QuizResultDetailDto getAssignmentSubmissionDetails(Long submissionId) {
        com.lms.course.entity.Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Soumission introuvable : " + submissionId));
        
        com.lms.course.entity.Assignment assignment = submission.getAssignment();
        com.lms.course.dto.QuizResultDetailDto dto = new com.lms.course.dto.QuizResultDetailDto();
        dto.setId(submission.getId());
        dto.setQuizId(assignment.getId());
        dto.setQuizTitle(assignment.getTitle());
        dto.setStudentId(submission.getStudentId());
        dto.setCompletedDate(submission.getSubmissionDate());
        
        // Calcule le score global
        double totalPoints = assignment.getQuestions().stream().mapToDouble(q -> q.getPoints() != null ? q.getPoints().doubleValue() : 0.0).sum();
        double earnedPoints = submission.getAnswers().stream().mapToDouble(sa -> sa.getScoreAwarded() != null ? sa.getScoreAwarded() : 0.0).sum();
        
        if (totalPoints > 0) {
            double score = (earnedPoints / totalPoints) * 100.0;
            dto.setScore(score);
            dto.setScoreOnTwenty(Math.round((score / 5.0) * 100.0) / 100.0);
            dto.setPassed(score >= 50.0); 
        } else {
            dto.setScore(0.0);
            dto.setScoreOnTwenty(0.0);
            dto.setPassed(false);
        }

        java.util.Map<Long, com.lms.course.entity.StudentAnswer> answerByQ = new java.util.HashMap<>();
        if (submission.getAnswers() != null) {
            for (com.lms.course.entity.StudentAnswer sa : submission.getAnswers()) {
                if (sa.getQuestion() != null) {
                    answerByQ.put(sa.getQuestion().getId(), sa);
                }
            }
        }

        java.util.List<com.lms.course.dto.QuizResultDetailDto.QuestionResultDto> qDtos = new java.util.ArrayList<>();
        if (assignment.getQuestions() != null) {
            for (com.lms.course.entity.Question q : assignment.getQuestions()) {
                com.lms.course.dto.QuizResultDetailDto.QuestionResultDto qDto =
                        new com.lms.course.dto.QuizResultDetailDto.QuestionResultDto();
                qDto.setQuestionId(q.getId());
                qDto.setText(q.getText());
                qDto.setJustification(q.getJustification());
                qDto.setPoints(q.getPoints());
                qDto.setType(q.getType() != null ? q.getType().name() : null);

                java.util.List<com.lms.course.dto.QuizResultDetailDto.OptionResultDto> opts = new java.util.ArrayList<>();
                if (q.getOptions() != null) {
                    for (com.lms.course.entity.QuestionOption o : q.getOptions()) {
                        opts.add(new com.lms.course.dto.QuizResultDetailDto.OptionResultDto(
                                o.getId(), o.getText(), o.isCorrect()));
                    }
                }
                qDto.setOptions(opts);

                com.lms.course.entity.StudentAnswer sa = answerByQ.get(q.getId());
                if (sa != null) {
                    qDto.setTextAnswer(sa.getTextAnswer());
                    qDto.setIsCorrect(sa.getIsCorrect());
                    qDto.setAiFeedback(sa.getAiFeedback());
                    qDto.setScoreAwarded(sa.getScoreAwarded());
                    if (sa.getSelectedOptions() != null && !sa.getSelectedOptions().isEmpty()) {
                         qDto.setSelectedOptionId(sa.getSelectedOptions().get(0).getId());
                    }
                }
                qDtos.add(qDto);
            }
        }
        dto.setQuestions(qDtos);
        return dto;
    }

    // --- Forum Methods ---

    public List<com.lms.course.dto.ForumThreadResponseDto> getAllForumThreads() {
        return forumThreadRepository.findAll().stream()
                .map(com.lms.course.dto.ForumThreadResponseDto::fromEntity).toList();
    }

    public List<com.lms.course.dto.ForumThreadResponseDto> getForumThreadsByModuleId(Long moduleId) {
        // Use a simple query to avoid loading relationships
        // Use native query to avoid Hibernate session issues
        List<Object[]> results = forumThreadRepository.findThreadIdsByModuleId(moduleId);
        return results.stream()
                .map(row -> {
                    com.lms.course.dto.ForumThreadResponseDto dto = new com.lms.course.dto.ForumThreadResponseDto();
                    dto.setId(((Number) row[0]).longValue());
                    dto.setTitle((String) row[1]);
                    dto.setContent((String) row[2]);
                    dto.setTag(null); // Skip tag for now
                    dto.setAuthorId((String) row[3]);
                    dto.setAuthorName((String) row[4]);
                    dto.setModuleId(((Number) row[5]).longValue());
                    dto.setModuleName("");
                    dto.setViewCount(((Number) row[6]).longValue());
                    dto.setUpvoteCount(((Number) row[7]).longValue());
                    dto.setPostCount(((Number) row[11]).intValue());
                    dto.setHasSolution(((Number) row[12]).longValue() > 0);
                    dto.setIsClosed((Boolean) row[8]);
                    dto.setCreatedAt((java.time.LocalDateTime) row[9]);
                    dto.setUpdatedAt((java.time.LocalDateTime) row[10]);
                    return dto;
                }).toList();
    }

    @org.springframework.transaction.annotation.Transactional
    public com.lms.course.dto.ForumThreadDetailDto getForumThreadById(Long id, String username) {
        com.lms.course.entity.ForumThread thread = forumThreadRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Thread not found with id: " + id));

        if (username != null && !username.isEmpty()) {
            int inserted = forumThreadViewRepository.insertIfNotExists(id, username);
            if (inserted > 0) {
                thread.setViewCount((thread.getViewCount() == null ? 0L : thread.getViewCount()) + 1);
                forumThreadRepository.save(thread);
            }
        }

        com.lms.course.dto.ForumThreadDetailDto dto = com.lms.course.dto.ForumThreadDetailDto.fromEntity(thread);
        if (username != null) {
            dto.setIsUpvoted(forumUpvoteRepository.findByUserIdAndThreadId(username, id).isPresent());
            if (dto.getPosts() != null) {
                for (com.lms.course.dto.ForumThreadDetailDto.PostDto postDto : dto.getPosts()) {
                    postDto.setIsUpvoted(forumUpvoteRepository.findByUserIdAndPostId(username, postDto.getId()).isPresent());
                    if (postDto.getReplies() != null) {
                        for (com.lms.course.dto.ForumThreadDetailDto.PostDto replyDto : postDto.getReplies()) {
                            replyDto.setIsUpvoted(forumUpvoteRepository.findByUserIdAndPostId(username, replyDto.getId()).isPresent());
                        }
                    }
                }
            }
        }
        log.info("Thread viewed: {} by user {}", id, username);
        return dto;
    }

    public com.lms.course.dto.ForumThreadResponseDto createForumThread(com.lms.course.dto.ForumThreadCreateDto dto) {
        CModule module = moduleRepository.findById(dto.getModuleId())
                .orElseThrow(() -> new NotFoundException("Module not found with id: " + dto.getModuleId()));

        if (forumThreadRepository.existsByTitleAndModuleId(dto.getTitle(), dto.getModuleId())) {
            throw new ConflictException("A thread with the same title already exists in this module");
        }

        com.lms.course.entity.ForumThread thread = new com.lms.course.entity.ForumThread();
        thread.setTitle(dto.getTitle());
        thread.setContent(dto.getContent());
        thread.setTag(dto.getTag());
        thread.setAuthorId(dto.getAuthorId());
        thread.setAuthorName(dto.getAuthorName());
        thread.setModule(module);

        return com.lms.course.dto.ForumThreadResponseDto.fromEntity(forumThreadRepository.save(thread));
    }

    public com.lms.course.dto.ForumThreadResponseDto updateForumThread(Long id, com.lms.course.dto.ForumThreadCreateDto dto) {
        com.lms.course.entity.ForumThread thread = forumThreadRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Thread not found with id: " + id));

        if (dto.getTitle() != null) thread.setTitle(dto.getTitle());
        if (dto.getContent() != null) thread.setContent(dto.getContent());
        if (dto.getTag() != null) thread.setTag(dto.getTag());

        return com.lms.course.dto.ForumThreadResponseDto.fromEntity(forumThreadRepository.save(thread));
    }

    @jakarta.transaction.Transactional
    public String deleteForumThread(Long id) {
        com.lms.course.entity.ForumThread thread = forumThreadRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Thread not found with id: " + id));
        forumThreadRepository.delete(thread);
        return "Thread deleted successfully";
    }

    public com.lms.course.entity.ForumPost createForumPost(com.lms.course.dto.ForumPostCreateDto dto) {
        com.lms.course.entity.ForumThread thread = forumThreadRepository.findById(dto.getThreadId())
                .orElseThrow(() -> new NotFoundException("Thread not found"));

        com.lms.course.entity.ForumPost post = new com.lms.course.entity.ForumPost();
        post.setContent(dto.getContent());
        post.setAuthorId(dto.getAuthorId());
        post.setAuthorName(dto.getAuthorName());
        post.setThread(thread);

        if (dto.getParentPostId() != null) {
            com.lms.course.entity.ForumPost parentPost = forumPostRepository.findById(dto.getParentPostId())
                    .orElseThrow(() -> new NotFoundException("Parent post not found"));
            post.setParentPost(parentPost);
        }

        try {
            restTemplate.postForObject("http://user-service/api/user/gamification/" + dto.getAuthorId() + "/xp?amount=15", null, String.class);
        } catch (Exception e) {
            System.err.println("Failed to award forum XP: " + e.getMessage());
        }

        return forumPostRepository.save(post);
    }

    public com.lms.course.entity.ForumPost updateForumPost(Long id, String content) {
        com.lms.course.entity.ForumPost post = forumPostRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Post not found with id: " + id));
        post.setContent(content);
        post.setIsEdited(true);
        return forumPostRepository.save(post);
    }

    @jakarta.transaction.Transactional
    public String deleteForumPost(Long id) {
        com.lms.course.entity.ForumPost post = forumPostRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Post not found with id: " + id));
        forumPostRepository.delete(post);
        return "Post deleted successfully";
    }

    @org.springframework.transaction.annotation.Transactional
    public void upvoteThread(Long threadId, String userId) {
        com.lms.course.entity.ForumThread thread = forumThreadRepository.findById(threadId)
                .orElseThrow(() -> new NotFoundException("Thread not found"));

        forumUpvoteRepository.findByUserIdAndThreadId(userId, threadId)
                .ifPresentOrElse(
                        upvote -> {},
                        () -> {
                            com.lms.course.entity.ForumUpvote upvote = new com.lms.course.entity.ForumUpvote();
                            upvote.setUserId(userId);
                            upvote.setThread(thread);
                            forumUpvoteRepository.save(upvote);
                            log.info("User {} upvoted thread {}", userId, threadId);
                            long current = thread.getUpvoteCount() != null ? thread.getUpvoteCount() : 0L;
                            thread.setUpvoteCount(current + 1);
                            forumThreadRepository.save(thread);
                        }
                );
    }

    @org.springframework.transaction.annotation.Transactional
    public void upvotePost(Long postId, String userId) {
        com.lms.course.entity.ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        forumUpvoteRepository.findByUserIdAndPostId(userId, postId)
                .ifPresentOrElse(
                        upvote -> {},
                        () -> {
                            com.lms.course.entity.ForumUpvote upvote = new com.lms.course.entity.ForumUpvote();
                            upvote.setUserId(userId);
                            upvote.setPost(post);
                            forumUpvoteRepository.save(upvote);
                            long current = post.getUpvoteCount() != null ? post.getUpvoteCount() : 0L;
                            post.setUpvoteCount(current + 1);
                            forumPostRepository.save(post);
                        }
                );
    }

    @org.springframework.transaction.annotation.Transactional
    public void removeUpvoteThread(Long threadId, String userId) {
        com.lms.course.entity.ForumThread thread = forumThreadRepository.findById(threadId)
                .orElseThrow(() -> new NotFoundException("Thread not found"));

        forumUpvoteRepository.findByUserIdAndThreadId(userId, threadId)
                .ifPresent(upvote -> {
                    forumUpvoteRepository.delete(upvote);
                    long current = thread.getUpvoteCount() != null ? thread.getUpvoteCount() : 0L;
                    if (current > 0) {
                        thread.setUpvoteCount(current - 1);
                        forumThreadRepository.save(thread);
                    }
                });
    }

    @org.springframework.transaction.annotation.Transactional
    public void removeUpvotePost(Long postId, String userId) {
        com.lms.course.entity.ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        forumUpvoteRepository.findByUserIdAndPostId(userId, postId)
                .ifPresent(upvote -> {
                    forumUpvoteRepository.delete(upvote);
                    long current = post.getUpvoteCount() != null ? post.getUpvoteCount() : 0L;
                    if (current > 0) {
                        post.setUpvoteCount(current - 1);
                        forumPostRepository.save(post);
                    }
                });
    }

    @org.springframework.transaction.annotation.Transactional
    public void markPostAsSolution(Long postId, Long threadId) {
        com.lms.course.entity.ForumThread thread = forumThreadRepository.findById(threadId)
                .orElseThrow(() -> new NotFoundException("Thread not found"));

        com.lms.course.entity.ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        if (!post.getThread().getId().equals(threadId)) {
            throw new ConflictException("Post does not belong to this thread");
        }

        if (thread.getSolution() != null) {
            thread.getSolution().setIsSolution(false);
            forumPostRepository.save(thread.getSolution());
        }

        post.setIsSolution(true);
        forumPostRepository.save(post);
        thread.setSolution(post);
        forumThreadRepository.save(thread);
    }

    @Override
    public com.lms.course.dto.StudentAnalyticsDto getStudentAnalytics(Long studentId) {
        List<com.lms.course.entity.Grade> studentGrades = gradeRepository.findByStudentId(studentId);
        if (studentGrades.isEmpty()) {
            com.lms.course.dto.StudentAnalyticsDto dto = new com.lms.course.dto.StudentAnalyticsDto();
            dto.setOverallAverage(0.0);
            dto.setHighestScore(0.0);
            dto.setLowestScore(0.0);
            dto.setTotalModules(0);
            dto.setProgression(java.util.Collections.emptyList());
            return dto;
        }

        // 1. Calculate student stats
        double sum = 0;
        double max = -1.0;
        double min = 101.0;

        for (com.lms.course.entity.Grade g : studentGrades) {
            double score = g.getScore() != null ? g.getScore() : 0.0;
            sum += score;
            if (score > max) max = score;
            if (score < min) min = score;
        }

        // 2. Calculate class averages for these modules
        List<com.lms.course.dto.StudentAnalyticsDto.ModuleScore> progression = new java.util.ArrayList<>();
        for (com.lms.course.entity.Grade g : studentGrades) {
            if (g.getModule() == null) continue;

            Long moduleId = g.getModule().getId();
            String code = g.getModule().getCodeEC() != null ? g.getModule().getCodeEC() : "MOD-" + moduleId;

            // Calculate average for this specific module
            List<com.lms.course.entity.Grade> moduleAllGrades = gradeRepository.findByModuleId(moduleId);
            double moduleAvg = moduleAllGrades.stream()
                .mapToDouble(gr -> gr.getScore() != null ? gr.getScore() : 0.0)
                .average()
                .orElse(0.0);

            com.lms.course.dto.StudentAnalyticsDto.ModuleScore moduleScore = new com.lms.course.dto.StudentAnalyticsDto.ModuleScore();
            moduleScore.setModuleCode(code);
            moduleScore.setScore(g.getScore());
            moduleScore.setClassAverage(moduleAvg);
            progression.add(moduleScore);
        }

        com.lms.course.dto.StudentAnalyticsDto dto = new com.lms.course.dto.StudentAnalyticsDto();
        dto.setOverallAverage(sum / studentGrades.size());
        dto.setHighestScore(max);
        dto.setLowestScore(min == 101.0 ? 0.0 : min);
        dto.setTotalModules(studentGrades.size());
        dto.setProgression(progression);
        return dto;
    }

    @Override
    public List<com.lms.course.entity.Lacune> getLacunesByStudentId(String studentId) {
        return lacuneRepository.findByStudentId(studentId);
    }

    @Override
    public List<CModule> getRecommendedModules(String studentId) {
        List<com.lms.course.entity.Lacune> lacunes = lacuneRepository.findByStudentId(studentId);
        if (lacunes.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        List<String> competences = lacunes.stream()
                .map(com.lms.course.entity.Lacune::getCompetence)
                .filter(java.util.Objects::nonNull)
                .map(String::toLowerCase)
                .distinct()
                .toList();

        // Récupérer les moduleIds déjà associés aux lacunes pour les prioriser
        java.util.Set<Long> lacuneModuleIds = lacunes.stream()
                .map(com.lms.course.entity.Lacune::getModuleId)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());

        List<CModule> allModules = moduleRepository.findAll();

        // Stratégie multi-niveaux :
        // 1. Modules directement liés aux lacunes (même moduleId)
        // 2. Modules dont les tags matchent une compétence lacunaire
        // 3. Modules dont le nom ou la description contient une compétence lacunaire
        List<CModule> recommended = allModules.stream()
                .filter(m -> {
                    // Niveau 1 : module directement lié à une lacune
                    if (lacuneModuleIds.contains(m.getId())) return true;

                    // Niveau 2 : tags du module contiennent une compétence lacunaire
                    if (m.getTags() != null) {
                        String tagsLower = m.getTags().toLowerCase();
                        if (competences.stream().anyMatch(tagsLower::contains)) return true;
                    }

                    // Niveau 3 : nom ou description du module contient une compétence lacunaire
                    String nameLower = m.getName() != null ? m.getName().toLowerCase() : "";
                    String descLower = m.getDescription() != null ? m.getDescription().toLowerCase() : "";
                    return competences.stream().anyMatch(c ->
                            nameLower.contains(c) || descLower.contains(c));
                })
                .limit(5)
                .collect(java.util.stream.Collectors.toList());

        resolveLecturerNames(recommended);
        return recommended;
    }

    @Override
    public List<com.lms.course.dto.AtRiskStudentDTO> getAtRiskStudents(String lecturerUsername, Long moduleId) {
        List<CModule> lecturerModules = moduleRepository.findByLecturerUsername(lecturerUsername);
        if (lecturerModules.isEmpty()) return java.util.Collections.emptyList();

        // If moduleId is provided, verify it belongs to this lecturer and only analyze that module.
        // Otherwise, analyze all modules taught by this lecturer.
        List<CModule> modulesToAnalyze = new java.util.ArrayList<>();
        if (moduleId != null) {
            for (CModule mod : lecturerModules) {
                if (mod.getId().equals(moduleId)) {
                    modulesToAnalyze.add(mod);
                    break;
                }
            }
            if (modulesToAnalyze.isEmpty()) {
                // The requested module doesn't belong to the lecturer
                return java.util.Collections.emptyList();
            }
        } else {
            modulesToAnalyze.addAll(lecturerModules);
        }

        java.util.Set<String> studentUsernames = new java.util.HashSet<>();
        java.util.Set<Long> lecturerModuleIds = new java.util.HashSet<>();
        for (CModule module : modulesToAnalyze) {
            lecturerModuleIds.add(module.getId());
            
            // 1. Détection des inscriptions réelles (croisement actif pour étudiants fantômes)
            try {
                List<java.util.Map<String, Object>> enrolled = getStudentsByModule(module.getId());
                if (enrolled != null) {
                    for (java.util.Map<String, Object> s : enrolled) {
                        String username = (String) s.get("username");
                        if (username != null) studentUsernames.add(username);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to fetch enrolled students for module {}: {}", module.getId(), e.getMessage());
            }

            // Fallback distinct quiz or attendance students
            studentUsernames.addAll(quizResultRepository.findDistinctStudentIdsByQuizModuleId(module.getId()));
            studentUsernames.addAll(attendanceRepository.findDistinctStudentIdsByModuleId(module.getId()));
        }

        List<com.lms.course.dto.AtRiskStudentDTO> atRiskStudents = new java.util.ArrayList<>();
        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        for (String uname : studentUsernames) {
            try {
                com.lms.course.client.UserClient.UserActivityDTO activity = userClient.getUserActivity(uname);
                if (activity == null) continue;

                // Filter student's quiz results to only include those in the lecturer's modules
                List<com.lms.course.entity.QuizResult> results = quizResultRepository.findByStudentId(uname).stream()
                        .filter(r -> r.getQuiz() != null && r.getQuiz().getModule() != null && lecturerModuleIds.contains(r.getQuiz().getModule().getId()))
                        .collect(java.util.stream.Collectors.toList());
                
                double riskScore = 0;
                java.util.List<String> reasons = new java.util.ArrayList<>();

                // Check attendance
                List<com.lms.course.entity.Attendance> studentAttendances = new java.util.ArrayList<>();
                for (CModule module : modulesToAnalyze) {
                    studentAttendances.addAll(attendanceRepository.findByModuleAndStudentId(module, uname));
                }

                // A. GHOST / DISENGAGED STUDENT DETECTOR
                if (results.isEmpty() && studentAttendances.isEmpty()) {
                    riskScore += 65; // Risque HIGH immédiat
                    reasons.add("Aucune participation académique (0 quiz, 0 présence)");
                }

                // 1. Activity Risk (30 pts max)
                if (activity.getLastLoginDate() == null) {
                    riskScore += 30;
                    reasons.add("Aucune connexion enregistrée");
                } else if (activity.getLastLoginDate().isBefore(now.minusDays(14))) {
                    riskScore += 30;
                    reasons.add("Inactif depuis plus de 2 semaines");
                } else if (activity.getLastLoginDate().isBefore(now.minusDays(7))) {
                    riskScore += 15;
                    reasons.add("Inactif depuis plus d'une semaine");
                }

                // 2. Performance Risk (50 pts max)
                double averageGrade = 0.0;
                double trend = 0.0;

                if (!results.isEmpty()) {
                    java.util.List<Double> scores = results.stream()
                        .map(r -> (double)r.getScore())
                        .collect(java.util.stream.Collectors.toList());
                    
                    averageGrade = scores.stream().mapToDouble(d -> d).average().orElse(0);
                    
                    // Calcul de la tendance académique séquentielle (trend)
                    if (scores.size() >= 2) {
                        double last = scores.get(scores.size() - 1);
                        double prev = scores.get(scores.size() - 2);
                        
                        if (last < 40) {
                            riskScore += 20;
                            reasons.add("Dernier quiz très faible (< 40%)");
                        } else if (last < prev * 0.7) {
                            riskScore += 15;
                            reasons.add("Chute brutale sur les quiz (-30%)");
                        }

                        // Moyenne des deltas consécutifs
                        double sumDiff = 0.0;
                        for (int i = 1; i < scores.size(); i++) {
                            sumDiff += (scores.get(i) - scores.get(i - 1));
                        }
                        trend = sumDiff / (scores.size() - 1);

                        // Si la tendance est fortement baissière, on ajoute du risque prédictif
                        if (trend < -10.0) {
                            riskScore += 15;
                            reasons.add(String.format("Tendance académique en baisse continue (%.1f%%/quiz)", trend));
                        }
                    }
                    
                    if (averageGrade < 50) {
                        riskScore += 15;
                        reasons.add("Moyenne générale faible (< 50%)");
                    } else if (averageGrade < 65) {
                        riskScore += 5;
                        reasons.add("Moyenne générale fragile (< 65%)");
                    }
                }

                // 3. Attendance Risk (20 pts max)
                if (!studentAttendances.isEmpty()) {
                    long absences = studentAttendances.stream()
                            .filter(a -> "ABSENT".equalsIgnoreCase(a.getStatus()))
                            .count();
                    long totalSessions = studentAttendances.size();
                    double absenceRate = (double) absences / totalSessions;
                    
                    if (absenceRate >= 0.30) {
                        riskScore += 20;
                        reasons.add(String.format("Absentéisme critique (%.0f%% d'absences)", absenceRate * 100));
                    } else if (absenceRate >= 0.15) {
                        riskScore += 10;
                        reasons.add(String.format("Absentéisme modéré (%.0f%% d'absences)", absenceRate * 100));
                    }
                }

                if (riskScore >= 20) {
                    String level = "LOW";
                    if (riskScore >= 50) level = "HIGH";
                    else if (riskScore >= 30) level = "MEDIUM";

                    // Fetch the real student information from user-service using Feign
                    String fullName = uname;
                    try {
                        com.lms.course.client.UserClient.StudentDTO studentInfo = userClient.getStudentByUsername(uname);
                        if (studentInfo != null && studentInfo.getFullName() != null && !studentInfo.getFullName().isBlank()) {
                            fullName = studentInfo.getFullName();
                        }
                    } catch (Exception e) {
                        log.warn("Could not resolve real full name for student username {}: {}", uname, e.getMessage());
                    }

                    atRiskStudents.add(com.lms.course.dto.AtRiskStudentDTO.builder()
                        .username(uname)
                        .fullName(fullName)
                        .riskLevel(level)
                        .reason(String.join(", ", reasons))
                        .lastActivity(activity.getLastLoginDate())
                        .averageGrade(averageGrade)
                        .trend(trend)
                        .build());
                }

            } catch (Exception e) {
                log.error("Error analyzing risk for student {}: {}", uname, e.getMessage());
            }
        }

        // Sort by risk level (High first)
        atRiskStudents.sort((a, b) -> {
            java.util.Map<String, Integer> weights = java.util.Map.of("HIGH", 3, "MEDIUM", 2, "LOW", 1);
            return weights.getOrDefault(b.getRiskLevel(), 0).compareTo(weights.getOrDefault(a.getRiskLevel(), 0));
        });

        return atRiskStudents;
    }

    private void notifyStudents(CModule module, String title, String body, String type) {
        if (module == null || module.getLevel() == null) return;
        
        String level = module.getLevel();
        
        // 1. In-app notifications via announcement-service (Bulk)
        try {
            List<java.util.Map<String, Object>> students = getStudentsByModule(module.getId());
            if (!students.isEmpty()) {
                List<String> userIds = students.stream()
                        .map(s -> (String) s.get("username"))
                        .filter(java.util.Objects::nonNull)
                        .collect(java.util.stream.Collectors.toList());
                
                java.util.Map<String, Object> bulkRequest = new java.util.HashMap<>();
                bulkRequest.put("userIds", userIds);
                bulkRequest.put("title", title);
                bulkRequest.put("content", body);
                bulkRequest.put("type", type);
                
                restTemplate.postForObject("http://announcement-service/api/announcement/notifications/bulk", bulkRequest, Object.class);
            }
        } catch (Exception e) {
            log.error("Failed to send in-app bulk notifications: {}", e.getMessage());
        }

        // 2. Push notifications via user-service (FCM)
        try {
            userClient.sendNotificationToLevel(new com.lms.course.client.UserClient.LevelNotificationRequest(level, title, body));
        } catch (Exception e) {
            log.error("Failed to send push notifications to level {}: {}", level, e.getMessage());
        }
    }
}
