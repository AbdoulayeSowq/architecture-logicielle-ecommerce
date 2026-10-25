package com.lms.user.service;

import com.lms.user.dto.*;
import com.lms.user.entity.AppUser;
import com.lms.user.entity.Lecturer;
import com.lms.user.entity.Student;
import java.util.List;
import java.util.Map;

public interface AdminService {
    String createStudent(StudentRequestDto dto, String groupName);
    Student getStudentById(Long id);
    Student getStudentByUsername(String username);
    List<Student> getAllStudents();
    List<Student> getStudentsByLevel(String level);
    String updateStudent(Long id, StudentUpdateDto dto);
    String deleteStudent(Long id);
    String createLecturer(LecturerRequestDto dto, String groupName);
    Lecturer getLecturerById(Long id);
    Lecturer getLecturerByUsername(String username);
    List<Lecturer> getAllLecturers();
    String updateLecturer(Long id, LecturerUpdateDto dto);
    void updateLecturer(Lecturer lecturer);
    String deleteLecturer(Long id);

    Map<String, String> getUserByUsername(String username);
    AppUser getAppUserByUsername(String username);
    void updateStudentDepartment(String username, String department);
    List<Map<String, String>> getAllContacts();
}
