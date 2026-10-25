package com.lms.course.service;


import com.lms.course.dto.CourseSessionDto;
import com.lms.course.dto.CourseUpdateDto;
import com.lms.course.dto.ModuleUpdateDto;
import com.lms.course.entity.CModule;
import com.lms.course.entity.Course;

import java.util.List;
import java.util.Map;

public interface CourseService {
    Course createCourse(Course course);
    Course getCourseById(Long id);
    Course updateCourse(Long id, CourseUpdateDto courseUpdateDto);
    String deleteCourse(Long id);
    List<Course> getAllCourses();
    List<CModule> getModules();
    CModule getModuleById(Long id);
    List<CModule> getModulesByDepartmentId(Long departmentId);
    CModule createModule(CModule module);
    CModule updateModule(Long id, ModuleUpdateDto moduleUpdateDto);
    String deleteModule(Long id);
    List<Course> getCoursesByModuleId(Long moduleId);
    List<CModule> getModulesByCourseId(Long courseId);
    List<CModule> getModulesByCourseId(Long courseId, String level);
    List<CModule> getModulesByLecturer(String lecturerUsername);
    List<CModule> getModulesByStudent(String username);
    List<Map<String, Object>> getStudentsByModule(Long moduleId);
    List<CModule> getModulesByTeachingUnit(Long teachingUnitId);
    List<CModule> getModulesBySemester(String semester);
    List<CModule> getModulesByLevel(String level);
    List<CModule> getModulesBySemesterAndLevel(String semester, String level);
    CModule getModuleByCodeEC(String codeEC);
    
    // TeachingUnit (UE) methods
    com.lms.course.entity.TeachingUnit createTeachingUnit(com.lms.course.entity.TeachingUnit teachingUnit);
    com.lms.course.entity.TeachingUnit getTeachingUnitById(Long id);
    com.lms.course.entity.TeachingUnit getTeachingUnitByCode(String code);
    List<com.lms.course.entity.TeachingUnit> getAllTeachingUnits();
    List<com.lms.course.entity.TeachingUnit> getTeachingUnitsBySemester(String semester);
    List<com.lms.course.entity.TeachingUnit> getTeachingUnitsByClassId(Long classId);
    com.lms.course.entity.TeachingUnit updateTeachingUnit(Long id, com.lms.course.entity.TeachingUnit teachingUnit);
    String deleteTeachingUnit(Long id);
    
    String assignCourseToModule(Long courseId, Long moduleId);
    List<Course> getCoursesWithoutAssignedToModule();
    String unassignCourseFromModule(Long courseId);
    List<Course> getCoursesWithoutAssigned();
    List<Course> getCoursesByDepartmentId(Long departmentId);
    String unassignCourseFromDepartment(Long courseId);
    String getCourseNameById(Long courseId);
    
    // Course Session (Séance) methods
    Course createCourseSession(Long moduleId, CourseSessionDto sessionDto, String lecturerUsername);
    Course updateCourseSession(Long sessionId, CourseSessionDto sessionDto, String lecturerUsername);
    Course getCourseSessionById(Long sessionId);
    List<Course> getCourseSessionsByModuleId(Long moduleId);
    String deleteCourseSession(Long sessionId, String lecturerUsername);
    
    // Material methods
    List<com.lms.course.entity.Material> getMaterialsByCourseId(Long courseId);
    List<com.lms.course.entity.Material> getMaterialsByModuleId(Long moduleId);
    com.lms.course.entity.Material createMaterial(com.lms.course.dto.MaterialRequestDto materialRequestDto);
    String deleteMaterial(Long id);
    
    // Grade methods
    List<com.lms.course.dto.GradeResponseDto> getGradesByStudentId(Long studentId);
    List<com.lms.course.dto.GradeResponseDto> getGradesByModuleId(Long moduleId);
    com.lms.course.dto.GradeResponseDto saveGrade(com.lms.course.dto.GradeRequestDto dto);
    com.lms.course.dto.StudentAnalyticsDto getStudentAnalytics(Long studentId);
    
    List<com.lms.course.entity.Assignment> getAssignmentsByModuleId(Long moduleId);
    com.lms.course.entity.Assignment getAssignmentById(Long id);
    com.lms.course.entity.Assignment createAssignment(com.lms.course.entity.Assignment assignment);
    com.lms.course.entity.Assignment createAssignmentFromDto(com.lms.course.dto.AssignmentCreateDto dto);
    com.lms.course.entity.Assignment updateAssignmentFromDto(Long id, com.lms.course.dto.AssignmentCreateDto dto);
    String deleteAssignment(Long id);
    
    // Submission methods
    List<com.lms.course.entity.Submission> getSubmissionsByAssignmentId(Long assignmentId);
    com.lms.course.entity.Submission submitAssignment(com.lms.course.entity.Submission submission);
    com.lms.course.dto.AssignmentSubmissionResultDto submitAssignmentFromDto(com.lms.course.dto.AssignmentSubmissionDto submissionDto);
    List<com.lms.course.entity.Submission> getSubmissionsByStudentId(String studentId);
    com.lms.course.dto.QuizResultDetailDto getAssignmentSubmissionDetails(Long submissionId);
    
    // Attendance methods
    List<com.lms.course.entity.Attendance> getAttendanceByModuleAndDate(Long moduleId, java.time.LocalDate date);
    com.lms.course.entity.Attendance saveAttendance(com.lms.course.entity.Attendance attendance);
    List<com.lms.course.entity.Attendance> getAttendanceByStudentId(String studentId);
    
    // Quiz methods
    List<com.lms.course.dto.QuizResponseDto> getQuizzesByModuleId(Long moduleId);
    com.lms.course.dto.QuizDetailDto getQuizById(Long id);
    com.lms.course.dto.QuizDetailDto getQuizForStudent(Long id);
    com.lms.course.dto.QuizResponseDto createQuizFromDto(com.lms.course.dto.QuizCreateDto dto);
    com.lms.course.dto.QuizResponseDto updateQuiz(Long id, com.lms.course.dto.QuizCreateDto dto);
    String deleteQuiz(Long id);
    
    // Quiz Result methods
    List<com.lms.course.dto.QuizResultSummaryDto> getQuizResultsByStudentId(String studentId);
    com.lms.course.dto.QuizResultDetailDto submitQuiz(com.lms.course.dto.QuizSubmissionDto dto);
    com.lms.course.dto.QuizResultDetailDto submitQuizWithDetails(com.lms.course.dto.QuizSubmissionDto dto);
    com.lms.course.dto.QuizResultDetailDto getQuizResultDetails(Long resultId);
    List<com.lms.course.entity.QuizResult> getQuizResultsByQuizId(Long quizId);

    // Forum methods
    List<com.lms.course.dto.ForumThreadResponseDto> getAllForumThreads();
    List<com.lms.course.dto.ForumThreadResponseDto> getForumThreadsByModuleId(Long moduleId);
    com.lms.course.dto.ForumThreadDetailDto getForumThreadById(Long id, String username);
    com.lms.course.dto.ForumThreadResponseDto createForumThread(com.lms.course.dto.ForumThreadCreateDto dto);
    com.lms.course.dto.ForumThreadResponseDto updateForumThread(Long id, com.lms.course.dto.ForumThreadCreateDto dto);
    String deleteForumThread(Long id);
    com.lms.course.entity.ForumPost createForumPost(com.lms.course.dto.ForumPostCreateDto dto);
    com.lms.course.entity.ForumPost updateForumPost(Long id, String content);
    String deleteForumPost(Long id);
    void upvoteThread(Long threadId, String userId);
    void upvotePost(Long postId, String userId);
    void removeUpvoteThread(Long threadId, String userId);
    void removeUpvotePost(Long postId, String userId);
    void markPostAsSolution(Long postId, Long threadId);
    
    // Adaptive Learning
    List<com.lms.course.entity.Lacune> getLacunesByStudentId(String studentId);
    List<CModule> getRecommendedModules(String studentId);
    
    // Early Warning System
    List<com.lms.course.dto.AtRiskStudentDTO> getAtRiskStudents(String lecturerUsername, Long moduleId);
}
