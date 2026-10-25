package com.lms.university.service.impl;

import com.lms.university.dto.DepartmentUpdateDto;
import com.lms.university.entity.Cycle;
import com.lms.university.entity.Department;
import com.lms.university.entity.Department;
import com.lms.university.exception.ConflictException;
import com.lms.university.exception.NotFoundException;
import com.lms.university.repository.CycleRepository;
import com.lms.university.repository.DepartmentRepository;
import com.lms.university.service.DepartmentService;
import com.lms.university.service.DepartmentService;
import com.lms.university.dto.UniversityEvent;
import com.lms.university.service.KafkaProducerService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {
    private final DepartmentRepository departmentRepository;
    private final CycleRepository cycleRepository;
    private final KafkaProducerService kafkaProducerService;

    @Override
    public List<Department> getDepartments() {
        List<Department> departments = departmentRepository.findAll();
        if (departments.isEmpty()) {
            throw new NotFoundException("No departments found");
        }
        return departments;
    }

    @Override
    public Department getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id).orElse(null);
        if(department == null) {
            throw new NotFoundException("Department not found");
        }
        return department;
    }

    @Override
    public Department createDepartment(Department department) {
        if(departmentRepository.existsByName(department.getName())) {
            throw new ConflictException("Department already exists");
        }
        Department saved = departmentRepository.save(department);
        kafkaProducerService.sendEvent(UniversityEvent.builder()
                .action("CREATED")
                .type("DEPT")
                .id(saved.getId())
                .name(saved.getName())
                .code(saved.getDId())
                .build());
        return saved;
    }

    @Override
    public Department updateDepartment(Long id, DepartmentUpdateDto departmentUpdateDto) {
        Department department = departmentRepository.findById(id).orElse(null);
        if (department == null) {
            throw new NotFoundException("Department not found");
        }
        department.setName(departmentUpdateDto.getName());
        department.setAbbreviation(departmentUpdateDto.getAbbreviation());
        department.setDescription(departmentUpdateDto.getDescription());
        department.setPhone(departmentUpdateDto.getPhone());
        department.setEmail(departmentUpdateDto.getEmail());
        department.setHeadId(departmentUpdateDto.getHeadId());
        
        Department saved = departmentRepository.save(department);
        kafkaProducerService.sendEvent(UniversityEvent.builder()
                .action("UPDATED")
                .type("DEPT")
                .id(saved.getId())
                .name(saved.getName())
                .code(saved.getDId())
                .build());
        return saved;
    }

    @Override
    public String deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id).orElse(null);
        if (department == null) {
            throw new NotFoundException("Department not found");
        }
        departmentRepository.delete(department);
        kafkaProducerService.sendEvent(UniversityEvent.builder()
                .action("DELETED")
                .type("DEPT")
                .id(id)
                .build());
        return "Department deleted successfully";
    }

    @Override
    public List<Department> getDepartmentsByCycleId(Long cycleId) {
        List<Department> departments = departmentRepository.findByCycleId(cycleId);
        if (departments.isEmpty()) {
            throw new NotFoundException("No departments found");
        }
        return departments;
    }

    @Override
    public String assignDepartmentToCycle(Long departmentId, Long cycleId) {
        Cycle cycle = cycleRepository.findById(cycleId).orElse(null);
        if (cycle == null) {
            throw new NotFoundException("Cycle not found");
        }
        Department department = departmentRepository.findById(departmentId).orElse(null);
        if (department == null) {
            throw new NotFoundException("Department not found");
        }
        department.setCycle(cycle);
        departmentRepository.save(department);
        return "Department assigned to cycle successfully";
    }

    @Override
    public String unassignDepartmentFromCycle(Long departmentId) {
        Department department = departmentRepository.findById(departmentId).orElse(null);
        if (department == null) {
            throw new NotFoundException("Department not found");
        }
        department.setCycle(null);
        departmentRepository.save(department);
        return "Department unassigned from cycle successfully";
    }

    @Override
    public List<Department> listDepartmentWithoutCycle() {
        List<Department> departments = departmentRepository.findByCycleIsNull();
        if (departments.isEmpty()) {
            throw new NotFoundException("No departments found");
        }
        return departments;
    }

    @Override
    public String assignCourseToDepartment(Long departmentId, Long courseId) {
        Department department = departmentRepository.findById(departmentId).orElse(null);
        if (department == null) {
            throw new NotFoundException("Department not found");
        }

        if (department.getCourseIds().contains(courseId)) {
            throw new ConflictException("Course already assigned to department");
        }
        department.getCourseIds().add(courseId);
        departmentRepository.save(department);

        return "Course assigned to department successfully";
    }

    @Override
    public String unassignCourseFromDepartment(Long departmentId, Long courseId) {
        Department department = departmentRepository.findById(departmentId).orElse(null);
        if (department == null) {
            throw new NotFoundException("Department not found");
        }

        if (!department.getCourseIds().contains(courseId)) {
            throw new NotFoundException("Course not assigned to department");
        }

        department.getCourseIds().remove(courseId);
        departmentRepository.save(department);

        return "Course unassigned from department successfully";
    }
}
