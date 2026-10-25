package com.lms.announcement.services.impl;

import com.lms.announcement.dto.*;
import com.lms.announcement.entity.Announcement;
import com.lms.announcement.entity.TargetAudience;
import com.lms.announcement.exception.InvalidDateException;
import com.lms.announcement.exception.NotFoundException;
import com.lms.announcement.repository.AnnouncementRepository;
import com.lms.announcement.services.AnnouncementService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Implementation of the AnnouncementService interface to manage announcement operations.
 */
@Service
@AllArgsConstructor
public class AnnouncementServiceImpl implements AnnouncementService {

    private AnnouncementRepository announcementRepository;

    /**
     * Creates an assignment announcement.
     * @param assignmentDto the assignment details
     * @return the saved assignment announcement
     * @throws InvalidDateException if the due date is in the past or null
     */
    public Announcement createAssignment(AssignmentDto assignmentDto) {
        if (assignmentDto.getAssignmentDueDate() != null
                && assignmentDto.getAssignmentDueDate().isBefore(LocalDate.now())) {
            throw new InvalidDateException("Assignment due date cannot be in the past");
        }
        Announcement assignment = createCommonAnnouncement(assignmentDto);
        assignment.setAssignmentCourseCode(assignmentDto.getAssignmentCourseCode());
        assignment.setAssignmentDueDate(assignmentDto.getAssignmentDueDate());
        assignment.setAssignmentInstructions(assignmentDto.getAssignmentInstructions());
        assignment.setAssignmentInstructor(assignmentDto.getAssignmentInstructor());
        return announcementRepository.save(assignment);
    }

    /**
     * Creates an event announcement.
     * @param eventDto the event details
     * @return the saved event announcement
     * @throws InvalidDateException if the event date is in the past or null
     */
    public Announcement createEvent(EventDto eventDto) {
        if (eventDto.getEventDate() != null
                && eventDto.getEventDate().isBefore(LocalDate.now())) {
            throw new InvalidDateException("Event date cannot be in the past");
        }
        Announcement event = createCommonAnnouncement(eventDto);
        event.setEventDate(eventDto.getEventDate());
        event.setEventTime(eventDto.getEventTime());
        event.setEventLocation(eventDto.getEventLocation());
        event.setEventOrganizer(eventDto.getEventOrganizer());
        event.setEventContact(eventDto.getEventContact());
        event.setEventFlyer(eventDto.getEventFlyer());
        event.setEventRegistration(eventDto.getEventRegistration());
        return announcementRepository.save(event);
    }

    /**
     * Creates an exam announcement.
     * @param examDto the exam details
     * @return the saved exam announcement
     * @throws InvalidDateException if the exam date is in the past or null
     */
    public Announcement createExam(ExamDto examDto) {
        if (examDto.getExamDate() == null || examDto.getExamTime() == null) {
            throw new InvalidDateException("Exam date or time cannot be null");
        }
        if (examDto.getExamDate().isBefore(LocalDate.now())) {
            throw new InvalidDateException("Exam date cannot be in the past");
        }
        Announcement exam = createCommonAnnouncement(examDto);
        exam.setExamCourseCode(examDto.getExamCourseCode());
        exam.setExamDate(examDto.getExamDate());
        exam.setExamTime(examDto.getExamTime());
        exam.setExamLocation(examDto.getExamLocation());
        exam.setExamInstructor(examDto.getExamInstructor());
        exam.setExamResources(examDto.getExamResources());
        return announcementRepository.save(exam);
    }

    /**
     * Creates a maintenance announcement.
     * @param maintenanceDto the maintenance details
     * @return the saved maintenance announcement
     * @throws InvalidDateException if the start or end date is invalid
     */
    public Announcement createMaintenance(MaintenanceDto maintenanceDto) {
        if (maintenanceDto.getMaintenanceStart() == null || maintenanceDto.getMaintenanceEnd() == null) {
            throw new InvalidDateException("Maintenance start and end dates cannot be null");
        }
        if (maintenanceDto.getMaintenanceStart().isBefore(LocalDateTime.now())) {
            throw new InvalidDateException("Maintenance start date cannot be in the past");
        }
        if (maintenanceDto.getMaintenanceEnd().isBefore(LocalDateTime.now())) {
            throw new InvalidDateException("Maintenance end date cannot be in the past");
        }
        if (maintenanceDto.getMaintenanceStart().isAfter(maintenanceDto.getMaintenanceEnd())) {
            throw new InvalidDateException("Maintenance start date cannot be after maintenance end date");
        }
        Announcement maintenance = createCommonAnnouncement(maintenanceDto);
        maintenance.setMaintenanceStart(maintenanceDto.getMaintenanceStart());
        maintenance.setMaintenanceEnd(maintenanceDto.getMaintenanceEnd());
        maintenance.setMaintenanceServices(maintenanceDto.getMaintenanceServices());
        maintenance.setMaintenanceContact(maintenanceDto.getMaintenanceContact());
        return announcementRepository.save(maintenance);
    }

    /**
     * Lists all announcements.
     * @return a list of all announcements
     */
    public List<AnnouncementResponseDto> listAllAnnouncements() {
        List<Announcement> announcements = announcementRepository.findAll();
        return announcements.stream().map(this::convertToAnnouncementResponseDto).toList();
    }

    /**
     * Lists announcements by type.
     * @param type the announcement type (assignment, event, exam, maintenance)
     * @return a list of announcements of the specified type
     */
    public List<AnnouncementResponseDto> listByType(String type) {
        List<Announcement> announcements = announcementRepository.findAllByType(type);
        return announcements.stream().map(this::convertToAnnouncementResponseDto).toList();
    }

    /**
     * Filtre les annonces par audience exacte (ex: STUDENTS, LECTURERS, ALL).
     */
    public List<AnnouncementResponseDto> listByAudience(String audience) {
        TargetAudience targetAudience;
        try {
            targetAudience = TargetAudience.valueOf(audience.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Audience invalide. Valeurs acceptées : ALL, STUDENTS, LECTURERS, COURSE, CLASS"
            );
        }
        return announcementRepository.findAllByTargetAudience(targetAudience)
                .stream().map(this::convertToAnnouncementResponseDto).toList();
    }

    /**
     * Retourne les annonces ciblant un cours précis (targetAudience = COURSE).
     */
    public List<AnnouncementResponseDto> listByCourse(String courseCode) {
        return announcementRepository
                .findAllByTargetAudienceAndTargetId(TargetAudience.COURSE, courseCode)
                .stream().map(this::convertToAnnouncementResponseDto).toList();
    }

    /**
     * Retourne les annonces ciblant une classe précise (targetAudience = CLASS).
     */
    public List<AnnouncementResponseDto> listByClass(String classId) {
        return announcementRepository
                .findAllByTargetAudienceAndTargetId(TargetAudience.CLASS, classId)
                .stream().map(this::convertToAnnouncementResponseDto).toList();
    }

    /**
     * Retourne toutes les annonces visibles par un étudiant donné :
     * ALL + STUDENTS + ses cours + ses classes.
     */
    public List<AnnouncementResponseDto> listForStudent(List<String> courseCodes, List<String> classIds) {
        List<String> safeCourseCodes = (courseCodes == null || courseCodes.isEmpty()) ? List.of("__NONE__") : courseCodes;
        List<String> safeClassIds = (classIds == null || classIds.isEmpty()) ? List.of("__NONE__") : classIds;
        return announcementRepository.findAnnouncementsForStudent(safeCourseCodes, safeClassIds)
                .stream().map(this::convertToAnnouncementResponseDto).toList();
    }

    /**
     * Retourne toutes les annonces visibles par un enseignant donné, filtrées sur son périmètre scolaire.
     */
    public List<AnnouncementResponseDto> listForLecturer(List<String> classIds, List<String> courseCodes, String username) {
        List<String> safeClassIds = (classIds == null || classIds.isEmpty()) ? List.of("__NONE__") : classIds;
        List<String> safeCourseCodes = (courseCodes == null || courseCodes.isEmpty()) ? List.of("__NONE__") : courseCodes;
        String safeUsername = (username == null || username.isBlank()) ? "__NONE__" : username.trim();
        return announcementRepository.findAnnouncementsForLecturer(safeClassIds, safeCourseCodes, safeUsername)
                .stream().map(this::convertToAnnouncementResponseDto).toList();
    }



    /**
     * Lists all assignments.
     * @return a list of all assignments
     */
    public List<AssignmentDto> listAssignments() {
        List<Announcement> assignments = announcementRepository.findAllByType("assignment");
        return assignments.stream().map(this::convertToAssignmentDto).toList();
    }

    /**
     * Lists all events.
     * @return a list of all events
     */
    public List<EventDto> listEvents() {
        List<Announcement> events = announcementRepository.findAllByType("event");
        return events.stream().map(this::convertToEventDto).toList();
    }

    /**
     * Lists all exams.
     * @return a list of all exams
     */
    public List<ExamDto> listExams() {
        List<Announcement> exams = announcementRepository.findAllByType("exam");
        return exams.stream().map(this::convertToExamDto).toList();
    }

    /**
     * Lists all maintenances.
     * @return a list of all maintenances
     */
    public List<MaintenanceDto> listMaintenances() {
        List<Announcement> maintenances = announcementRepository.findAllByType("maintenance");
        return maintenances.stream().map(this::convertToMaintenanceDto).toList();
    }

    /**
     * Deletes an announcement by ID.
     * @param id the announcement ID
     * @return a confirmation message
     * @throws NotFoundException if the announcement is not found
     */
    public String deleteAnnouncement(Long id) {
        Announcement announcement = announcementRepository.findById(id).orElse(null);
        if (announcement == null) {
            throw new NotFoundException("Announcement not found");
        }
        announcementRepository.delete(announcement);
        return "Announcement deleted successfully";
    }

    /**
     * Updates an assignment announcement.
     * @param id the announcement ID
     * @param assignmentDto the assignment details
     * @return the updated assignment announcement
     * @throws NotFoundException if the announcement is not found
     * @throws InvalidDateException if the due date is invalid
     */
    public Announcement updateAssignment(Long id, AssignmentDto assignmentDto) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Announcement not found"));
        
        if (!"assignment".equals(announcement.getType())) {
            throw new IllegalArgumentException("Announcement is not of type assignment");
        }
        
        announcement.setTitle(assignmentDto.getTitle());
        announcement.setDescription(assignmentDto.getDescription());
        announcement.setAssignmentCourseCode(assignmentDto.getAssignmentCourseCode());
        announcement.setAssignmentDueDate(assignmentDto.getAssignmentDueDate());
        announcement.setAssignmentInstructions(assignmentDto.getAssignmentInstructions());
        announcement.setAssignmentInstructor(assignmentDto.getAssignmentInstructor());
        
        if (assignmentDto.getAssignmentDueDate() != null
                && assignmentDto.getAssignmentDueDate().isBefore(LocalDate.now())) {
            throw new InvalidDateException("Assignment due date cannot be in the past");
        }
        
        return announcementRepository.save(announcement);
    }

    /**
     * Updates an event announcement.
     * @param id the announcement ID
     * @param eventDto the event details
     * @return the updated event announcement
     * @throws NotFoundException if the announcement is not found
     * @throws InvalidDateException if the event date is invalid
     */
    public Announcement updateEvent(Long id, EventDto eventDto) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Announcement not found"));
        
        if (!"event".equals(announcement.getType())) {
            throw new IllegalArgumentException("Announcement is not of type event");
        }
        
        announcement.setTitle(eventDto.getTitle());
        announcement.setDescription(eventDto.getDescription());
        announcement.setEventDate(eventDto.getEventDate());
        announcement.setEventTime(eventDto.getEventTime());
        announcement.setEventLocation(eventDto.getEventLocation());
        announcement.setEventOrganizer(eventDto.getEventOrganizer());
        announcement.setEventContact(eventDto.getEventContact());
        announcement.setEventFlyer(eventDto.getEventFlyer());
        announcement.setEventRegistration(eventDto.getEventRegistration());
        
        if (eventDto.getEventDate() != null
                && eventDto.getEventDate().isBefore(LocalDate.now())) {
            throw new InvalidDateException("Event date cannot be in the past");
        }
        
        return announcementRepository.save(announcement);
    }

    /**
     * Updates an exam announcement.
     * @param id the announcement ID
     * @param examDto the exam details
     * @return the updated exam announcement
     * @throws NotFoundException if the announcement is not found
     * @throws InvalidDateException if the exam date is invalid
     */
    public Announcement updateExam(Long id, ExamDto examDto) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Announcement not found"));
        
        if (!"exam".equals(announcement.getType())) {
            throw new IllegalArgumentException("Announcement is not of type exam");
        }
        
        announcement.setTitle(examDto.getTitle());
        announcement.setDescription(examDto.getDescription());
        announcement.setExamCourseCode(examDto.getExamCourseCode());
        announcement.setExamDate(examDto.getExamDate());
        announcement.setExamTime(examDto.getExamTime());
        announcement.setExamLocation(examDto.getExamLocation());
        announcement.setExamInstructor(examDto.getExamInstructor());
        announcement.setExamResources(examDto.getExamResources());
        
        if (examDto.getExamDate().isBefore(LocalDate.now())) {
            throw new InvalidDateException("Exam date cannot be in the past");
        }
        
        return announcementRepository.save(announcement);
    }

    /**
     * Updates a maintenance announcement.
     * @param id the announcement ID
     * @param maintenanceDto the maintenance details
     * @return the updated maintenance announcement
     * @throws NotFoundException if the announcement is not found
     * @throws InvalidDateException if the maintenance dates are invalid
     */
    public Announcement updateMaintenance(Long id, MaintenanceDto maintenanceDto) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Announcement not found"));
        
        if (!"maintenance".equals(announcement.getType())) {
            throw new IllegalArgumentException("Announcement is not of type maintenance");
        }
        
        announcement.setTitle(maintenanceDto.getTitle());
        announcement.setDescription(maintenanceDto.getDescription());
        announcement.setMaintenanceStart(maintenanceDto.getMaintenanceStart());
        announcement.setMaintenanceEnd(maintenanceDto.getMaintenanceEnd());
        announcement.setMaintenanceServices(maintenanceDto.getMaintenanceServices());
        announcement.setMaintenanceContact(maintenanceDto.getMaintenanceContact());
        
        if (maintenanceDto.getMaintenanceStart().isBefore(LocalDateTime.now())) {
            throw new InvalidDateException("Maintenance start date cannot be in the past");
        }
        if (maintenanceDto.getMaintenanceEnd().isBefore(LocalDateTime.now())) {
            throw new InvalidDateException("Maintenance end date cannot be in the past");
        }
        if (maintenanceDto.getMaintenanceStart().isAfter(maintenanceDto.getMaintenanceEnd())) {
            throw new InvalidDateException("Maintenance start date cannot be after maintenance end date");
        }
        
        return announcementRepository.save(announcement);
    }

    // Helper methods to convert Announcement entity to DTOs

    private AnnouncementResponseDto convertToAnnouncementResponseDto(Announcement announcement) {
        AnnouncementResponseDto dto = new AnnouncementResponseDto();
        dto.setId(announcement.getId());
        dto.setTitle(announcement.getTitle());
        dto.setType(announcement.getType());
        dto.setDescription(announcement.getDescription());
        dto.setTargetAudience(announcement.getTargetAudience());
        dto.setTargetId(announcement.getTargetId());
        dto.setCreatedDate(announcement.getCreatedDate());

        // Map specific fields based on type or just map all
        dto.setAssignmentCourseCode(announcement.getAssignmentCourseCode());
        dto.setAssignmentDueDate(announcement.getAssignmentDueDate());
        dto.setAssignmentInstructor(announcement.getAssignmentInstructor());

        dto.setExamCourseCode(announcement.getExamCourseCode());
        dto.setExamDate(announcement.getExamDate());
        dto.setExamTime(announcement.getExamTime());
        dto.setExamLocation(announcement.getExamLocation());
        dto.setExamInstructor(announcement.getExamInstructor());

        dto.setEventDate(announcement.getEventDate());
        dto.setEventTime(announcement.getEventTime());
        dto.setEventLocation(announcement.getEventLocation());

        dto.setMaintenanceStart(announcement.getMaintenanceStart());
        dto.setMaintenanceEnd(announcement.getMaintenanceEnd());

        return dto;
    }

    private Announcement createCommonAnnouncement(AnnouncementDto dto) {
        Announcement announcement = new Announcement();
        
        // Clean title: remove redundant prefixes like "Devoir — " or "Info — "
        String rawTitle = dto.getTitle() != null ? dto.getTitle() : "";
        String cleanedTitle = rawTitle.replaceAll("(?i)^(Devoir|Info|Examen|Maintenance|ASSIGNMENT|EVENT)\\s*—\\s*", "");
        announcement.setTitle(cleanedTitle);
        
        announcement.setType(dto.getType());
        announcement.setDescription(dto.getDescription());

        // Ciblage : valider et appliquer targetAudience / targetId
        TargetAudience audience;
        try {
            audience = TargetAudience.valueOf(
                dto.getTargetAudience() != null ? dto.getTargetAudience().toUpperCase() : "ALL"
            );
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "targetAudience invalide. Valeurs acceptées : ALL, STUDENTS, LECTURERS, COURSE, CLASS"
            );
        }
        announcement.setTargetAudience(audience);

        if (audience == TargetAudience.COURSE || audience == TargetAudience.CLASS) {
            if (dto.getTargetId() == null || dto.getTargetId().isBlank()) {
                throw new IllegalArgumentException(
                    "targetId est requis quand targetAudience = " + audience.name()
                );
            }
            announcement.setTargetId(dto.getTargetId().trim());
        } else {
            announcement.setTargetId(null);
        }
        return announcement;
    }

    private AssignmentDto convertToAssignmentDto(Announcement announcement) {
        AssignmentDto dto = new AssignmentDto();
        dto.setTitle(announcement.getTitle());
        dto.setType(announcement.getType());
        dto.setDescription(announcement.getDescription());
        dto.setAssignmentCourseCode(announcement.getAssignmentCourseCode());
        dto.setAssignmentDueDate(announcement.getAssignmentDueDate());
        dto.setAssignmentInstructions(announcement.getAssignmentInstructions());
        dto.setAssignmentInstructor(announcement.getAssignmentInstructor());
        return dto;
    }

    private EventDto convertToEventDto(Announcement announcement) {
        EventDto dto = new EventDto();
        dto.setTitle(announcement.getTitle());
        dto.setType(announcement.getType());
        dto.setDescription(announcement.getDescription());
        dto.setEventDate(announcement.getEventDate());
        dto.setEventTime(announcement.getEventTime());
        dto.setEventLocation(announcement.getEventLocation());
        dto.setEventOrganizer(announcement.getEventOrganizer());
        dto.setEventContact(announcement.getEventContact());
        dto.setEventFlyer(announcement.getEventFlyer());
        dto.setEventRegistration(announcement.getEventRegistration());
        return dto;
    }

    private MaintenanceDto convertToMaintenanceDto(Announcement announcement) {
        MaintenanceDto dto = new MaintenanceDto();
        dto.setTitle(announcement.getTitle());
        dto.setType(announcement.getType());
        dto.setDescription(announcement.getDescription());
        dto.setMaintenanceStart(announcement.getMaintenanceStart());
        dto.setMaintenanceEnd(announcement.getMaintenanceEnd());
        dto.setMaintenanceServices(announcement.getMaintenanceServices());
        dto.setMaintenanceContact(announcement.getMaintenanceContact());
        return dto;
    }

    private ExamDto convertToExamDto(Announcement announcement) {
        ExamDto dto = new ExamDto();
        dto.setTitle(announcement.getTitle());
        dto.setType(announcement.getType());
        dto.setDescription(announcement.getDescription());
        dto.setExamCourseCode(announcement.getExamCourseCode());
        dto.setExamDate(announcement.getExamDate());
        dto.setExamTime(announcement.getExamTime());
        dto.setExamLocation(announcement.getExamLocation());
        dto.setExamInstructor(announcement.getExamInstructor());
        dto.setExamResources(announcement.getExamResources());
        return dto;
    }
}
