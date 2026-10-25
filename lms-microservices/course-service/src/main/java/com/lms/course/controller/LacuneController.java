package com.lms.course.controller;

import com.lms.course.entity.Lacune;
import com.lms.course.repository.LacuneRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/course/lacune")
public class LacuneController {

    private final LacuneRepository lacuneRepository;

    public LacuneController(LacuneRepository lacuneRepository) {
        this.lacuneRepository = lacuneRepository;
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Lacune>> getByStudent(@PathVariable String studentId) {
        return ResponseEntity.ok(lacuneRepository.findByStudentId(studentId));
    }

    @GetMapping("/student/{studentId}/module/{moduleId}")
    public ResponseEntity<List<Lacune>> getByStudentAndModule(
            @PathVariable String studentId,
            @PathVariable Long moduleId) {
        return ResponseEntity.ok(lacuneRepository.findByStudentIdAndModuleId(studentId, moduleId));
    }

    @DeleteMapping("/student/{studentId}/module/{moduleId}")
    public ResponseEntity<Void> deleteByStudentAndModule(
            @PathVariable String studentId,
            @PathVariable Long moduleId) {
        lacuneRepository.deleteByStudentIdAndModuleId(studentId, moduleId);
        return ResponseEntity.noContent().build();
    }
}
