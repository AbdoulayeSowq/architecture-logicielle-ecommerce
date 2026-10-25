package com.lms.university.service.impl;

import com.lms.university.dto.TimetableDto;
import com.lms.university.dto.TimetableEntryDto;
import com.lms.university.entity.Timetable;
import com.lms.university.entity.TimetableEntry;
import com.lms.university.repository.TimetableRepository;
import com.lms.university.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimetableServiceImpl implements TimetableService {

    private final TimetableRepository timetableRepository;

    @Override
    @Transactional
    public TimetableDto createTimetable(TimetableDto dto) {
        Timetable timetable = new Timetable();
        timetable.setClassId(normalizeClassId(dto.getClassId()));
        timetable.setStartDate(dto.getStartDate());
        timetable.setEndDate(dto.getEndDate());
        timetable.setPublished(dto.isPublished());
        
        if (dto.getEntries() != null) {
            List<TimetableEntry> entries = dto.getEntries().stream()
                    .map(eDto -> mapToEntity(eDto, timetable))
                    .collect(Collectors.toList());
            timetable.setEntries(entries);
        }

        Timetable saved = timetableRepository.save(timetable);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public TimetableDto updateTimetable(Long id, TimetableDto dto) {
        Timetable timetable = timetableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Timetable not found"));

        timetable.setStartDate(dto.getStartDate());
        timetable.setEndDate(dto.getEndDate());
        timetable.setPublished(dto.isPublished());
        if (dto.getClassId() != null) {
            timetable.setClassId(normalizeClassId(dto.getClassId()));
        }

        // Update entries
        timetable.getEntries().clear();
        if (dto.getEntries() != null) {
            List<TimetableEntry> newEntries = dto.getEntries().stream()
                    .map(eDto -> mapToEntity(eDto, timetable))
                    .collect(Collectors.toList());
            timetable.getEntries().addAll(newEntries);
        }

        Timetable updated = timetableRepository.save(timetable);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void deleteTimetable(Long id) {
        timetableRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public TimetableDto getTimetable(Long id) {
        Timetable timetable = timetableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Timetable not found"));
        return mapToDto(timetable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimetableDto> getTimetablesByClass(String classId) {
        return timetableRepository.findByClassId(normalizeClassId(classId)).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TimetableDto getLatestPublishedTimetable(String classId) {
        return timetableRepository.findFirstByClassIdAndPublishedOrderByCreatedDateDesc(normalizeClassId(classId), true)
                .map(this::mapToDto)
                .orElse(null);
    }

    private String normalizeClassId(String classId) {
        if (classId == null) return null;
        return classId.trim()
                .toUpperCase()
                .replaceAll("[\\s_]+", "-")
                .replaceAll("-+", "-");
    }

    @Override
    @Transactional
    public TimetableDto publishTimetable(Long id) {
        Timetable timetable = timetableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Timetable not found"));
        timetable.setPublished(true);
        return mapToDto(timetableRepository.save(timetable));
    }

    private TimetableDto mapToDto(Timetable entity) {
        TimetableDto dto = new TimetableDto();
        dto.setId(entity.getId());
        dto.setClassId(entity.getClassId());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setPublished(entity.isPublished());
        
        if (entity.getEntries() != null) {
            dto.setEntries(entity.getEntries().stream()
                    .map(this::mapToEntryDto)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    private TimetableEntryDto mapToEntryDto(TimetableEntry entity) {
        TimetableEntryDto dto = new TimetableEntryDto();
        dto.setId(entity.getId());
        dto.setDayOfWeek(entity.getDayOfWeek());
        dto.setStartTime(entity.getStartTime());
        dto.setEndTime(entity.getEndTime());
        dto.setCourseName(entity.getCourseName());
        dto.setTeacherName(entity.getTeacherName());
        dto.setType(entity.getType());
        dto.setOnline(entity.isOnline());
        return dto;
    }

    private TimetableEntry mapToEntity(TimetableEntryDto dto, Timetable timetable) {
        TimetableEntry entity = new TimetableEntry();
        entity.setTimetable(timetable);
        entity.setDayOfWeek(dto.getDayOfWeek());
        entity.setStartTime(dto.getStartTime());
        entity.setEndTime(dto.getEndTime());
        entity.setCourseName(dto.getCourseName());
        entity.setTeacherName(dto.getTeacherName());
        entity.setType(dto.getType());
        entity.setOnline(dto.isOnline());
        return entity;
    }
}
