package com.lms.announcement.services;

import com.lms.announcement.dto.*;
import com.lms.announcement.entity.Announcement;

import java.util.List;

public interface AnnouncementService {
    Announcement createAssignment(AssignmentDto assignmentDto);
    Announcement createEvent(EventDto eventDto);
    Announcement createExam(ExamDto examDto);
    Announcement createMaintenance(MaintenanceDto maintenanceDto);

    Announcement updateAssignment(Long id, AssignmentDto assignmentDto);
    Announcement updateEvent(Long id, EventDto eventDto);
    Announcement updateExam(Long id, ExamDto examDto);
    Announcement updateMaintenance(Long id, MaintenanceDto maintenanceDto);

    List<AnnouncementResponseDto> listAllAnnouncements();
    List<AnnouncementResponseDto> listByType(String type);
    List<AnnouncementResponseDto> listByAudience(String audience);
    List<AnnouncementResponseDto> listByCourse(String courseCode);
    List<AnnouncementResponseDto> listByClass(String classId);
    List<AnnouncementResponseDto> listForStudent(List<String> courseCodes, List<String> classIds);
    List<AnnouncementResponseDto> listForLecturer(List<String> classIds, List<String> courseCodes, String username);

    List<AssignmentDto> listAssignments();
    List<EventDto> listEvents();
    List<ExamDto> listExams();
    List<MaintenanceDto> listMaintenances();
    String deleteAnnouncement(Long id);
}

