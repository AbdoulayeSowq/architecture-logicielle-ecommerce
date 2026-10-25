package com.lms.university.service.impl;

import com.lms.university.dto.CycleUpdateDto;
import com.lms.university.entity.Department;
import com.lms.university.entity.Cycle;
import com.lms.university.exception.ConflictException;
import com.lms.university.exception.NotFoundException;
import com.lms.university.repository.DepartmentRepository;
import com.lms.university.repository.CycleRepository;
import com.lms.university.service.CycleService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class CycleServiceImpl implements CycleService {

    private final CycleRepository cycleRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    public List<Cycle> listCycles() {
        List<Cycle> cycles = cycleRepository.findAll();
        if (cycles.isEmpty()) {
            throw new NotFoundException("No cycles found");
        }
        return cycles;
    }

    @Override
    public Cycle getCycleById(Long id) {
        Cycle cycle = cycleRepository.findById(id).orElse(null);
        if (cycle == null) {
            throw new NotFoundException("Cycle not found");
        }
        return cycle;
    }

    @Override
    public Cycle createCycle(Cycle cycle) {
        if (cycleRepository.existsByName(cycle.getName())) {
            throw new ConflictException("Cycle already exists");
        }
        return cycleRepository.save(cycle);
    }

    @Override
    public Cycle updateCycle(Long id, CycleUpdateDto cycleUpdateDto) {
        Cycle cycle = cycleRepository.findById(id).orElse(null);
        if (cycle == null) {
            throw new NotFoundException("Cycle not found");
        }
        cycle.setName(cycleUpdateDto.getName());
        cycle.setDescription(cycleUpdateDto.getDescription());
        return cycleRepository.save(cycle);
    }

    @Override
    public String deleteCycle(Long id) {
        Cycle cycle = cycleRepository.findById(id).orElse(null);
        if (cycle == null) {
            throw new NotFoundException("Cycle not found");
        }
        cycleRepository.delete(cycle);
        return "Cycle deleted successfully";
    }

    @Override
    public List<Department> getDepartmentsByCycleId(Long cycleId) {
        return departmentRepository.findByCycleId(cycleId);
    }

    @Override
    public String assignDepartmentToCycle(Long cycleId, Long departmentId) {
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
}
