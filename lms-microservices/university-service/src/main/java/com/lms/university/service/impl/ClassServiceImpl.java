package com.lms.university.service.impl;

import com.lms.university.dto.ClassUpdateDto;
import com.lms.university.entity.Class;
import com.lms.university.entity.Department;
import com.lms.university.exception.ConflictException;
import com.lms.university.exception.NotFoundException;
import com.lms.university.repository.ClassRepository;
import com.lms.university.repository.DepartmentRepository;
import com.lms.university.service.ClassService;
import com.lms.university.dto.UniversityEvent;
import com.lms.university.service.KafkaProducerService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class ClassServiceImpl implements ClassService {

    private final ClassRepository classRepository;
    private final DepartmentRepository departmentRepository;
    private final KafkaProducerService kafkaProducerService;

    @Override
    public List<Class> listClasses() {
        List<Class> classes = classRepository.findAll();
        if (classes.isEmpty()) {
            throw new NotFoundException("No classes found");
        }
        return classes;
    }

    @Override
    public Class getClassById(Long id) {
        Class classRef = classRepository.findById(id).orElse(null);
        if (classRef == null) {
            throw new NotFoundException("Class not found");
        }
        return classRef;
    }

    private String formatClassName(String name, Department department) {
        if (name == null) return null;
        String baseName = name.trim().toLowerCase().replaceAll("\\s+", "");
        if (department != null && department.getAbbreviation() != null) {
            String suffix = department.getAbbreviation().trim().toLowerCase();
            if (!baseName.endsWith("-" + suffix)) {
                // Remove existing suffix if any to prevent duplicates like dic1-git-git
                if (baseName.contains("-")) {
                    baseName = baseName.substring(0, baseName.indexOf("-"));
                }
                baseName = baseName + "-" + suffix;
            }
        }
        return baseName;
    }

    @Override
    public Class createClass(Class classRef) {
        if (classRef.getDepartment() != null) {
            classRef.setName(formatClassName(classRef.getName(), classRef.getDepartment()));
        } else {
            classRef.setName(classRef.getName() != null ? classRef.getName().trim().toLowerCase() : null);
        }

        if (classRepository.existsByName(classRef.getName())) {
            throw new ConflictException("Class already exists");
        }
        Class saved = classRepository.save(classRef);
        kafkaProducerService.sendEvent(UniversityEvent.builder()
                .action("CREATED")
                .type("CLASS")
                .id(saved.getId())
                .name(saved.getName())
                .code(saved.getClid())
                .build());
        return saved;
    }

    @Override
    public Class updateClass(Long id, ClassUpdateDto classUpdateDto) {
        Class classRef = classRepository.findById(id).orElse(null);
        if (classRef == null) {
            throw new NotFoundException("Class not found");
        }
        classRef.setName(formatClassName(classUpdateDto.getName(), classRef.getDepartment()));
        classRef.setDescription(classUpdateDto.getDescription());
        Class saved = classRepository.save(classRef);
        kafkaProducerService.sendEvent(UniversityEvent.builder()
                .action("UPDATED")
                .type("CLASS")
                .id(saved.getId())
                .name(saved.getName())
                .code(saved.getClid())
                .build());
        return saved;
    }

    @Override
    public String deleteClass(Long id) {
        Class classRef = classRepository.findById(id).orElse(null);
        if (classRef == null) {
            throw new NotFoundException("Class not found");
        }
        classRepository.delete(classRef);
        kafkaProducerService.sendEvent(UniversityEvent.builder()
                .action("DELETED")
                .type("CLASS")
                .id(id)
                .build());
        return "Class deleted successfully";
    }

    @Override
    public List<Class> getClassesByDepartmentId(Long departmentId) {
        List<Class> classes = classRepository.findByDepartmentId(departmentId);
        if (classes.isEmpty()) {
            throw new NotFoundException("No classes found");
        }
        return classes;
    }

    @Override
    public List<Class> listClassesWithoutDepartment() {
        List<Class> classes = classRepository.findByDepartmentIsNull();
        if (classes.isEmpty()) {
            throw new NotFoundException("No classes found");
        }
        return classes;
    }

    @Override
    public String assignClassToDepartment(Long departmentId, Long classId) {
        Department department = departmentRepository.findById(departmentId).orElse(null);
        if (department == null) {
            throw new NotFoundException("Department not found");
        }
        Class classRef = classRepository.findById(classId).orElse(null);
        if (classRef == null) {
            throw new NotFoundException("Class not found");
        }
        classRef.setDepartment(department);
        classRef.setName(formatClassName(classRef.getName(), department));
        classRepository.save(classRef);
        return "Class assigned to department successfully";
    }

    @Override
    public String unassignClassFromDepartment(Long classId) {
        Class classRef = classRepository.findById(classId).orElse(null);
        if (classRef == null) {
            throw new NotFoundException("Class not found");
        }
        classRef.setDepartment(null);
        classRepository.save(classRef);
        return "Class unassigned from department successfully";
    }
}
