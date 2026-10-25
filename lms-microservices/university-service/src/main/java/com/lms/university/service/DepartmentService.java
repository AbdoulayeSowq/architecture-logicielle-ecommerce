package com.lms.university.service;

import com.lms.university.dto.DepartmentUpdateDto;
import com.lms.university.entity.Department;

import java.util.List;

public interface DepartmentService {
    List<Department> getDepartments();
    Department getDepartmentById(Long id);
    Department createDepartment(Department department);
    Department updateDepartment(Long id, DepartmentUpdateDto departmentUpdateDto);
    String deleteDepartment(Long id);
    List<Department> getDepartmentsByCycleId(Long cycleId);
    String assignDepartmentToCycle(Long departmentId, Long cycleId);
    String unassignDepartmentFromCycle(Long departmentId);
    List<Department> listDepartmentWithoutCycle();
    String assignCourseToDepartment(Long departmentId, Long courseId);
    String unassignCourseFromDepartment(Long departmentId, Long courseId);
}
