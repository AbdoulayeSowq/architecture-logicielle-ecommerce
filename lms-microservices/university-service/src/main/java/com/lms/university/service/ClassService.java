package com.lms.university.service;

import com.lms.university.dto.ClassUpdateDto;
import com.lms.university.entity.Class;
import com.lms.university.entity.Department;

import java.util.List;

public interface ClassService {
    List<Class> listClasses();
    Class getClassById(Long id);
    Class createClass(Class classRef);
    Class updateClass(Long id, ClassUpdateDto classUpdateDto);
    String deleteClass(Long id);
    List<Class> getClassesByDepartmentId(Long departmentId);
    List<Class> listClassesWithoutDepartment();
    String assignClassToDepartment(Long departmentId, Long classId);
    String unassignClassFromDepartment(Long classId);
}
