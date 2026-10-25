package com.lms.university.service;

import com.lms.university.dto.CycleUpdateDto;
import com.lms.university.entity.Department;
import com.lms.university.entity.Cycle;

import java.util.List;

public interface CycleService {
    List<Cycle> listCycles();
    Cycle getCycleById(Long id);
    Cycle createCycle(Cycle cycle);
    Cycle updateCycle(Long id, CycleUpdateDto cycleUpdateDto);
    String deleteCycle(Long id);
    List<Department> getDepartmentsByCycleId(Long cycleId);
    String assignDepartmentToCycle(Long cycleId, Long departmentId);
    String unassignDepartmentFromCycle(Long departmentId);
}
