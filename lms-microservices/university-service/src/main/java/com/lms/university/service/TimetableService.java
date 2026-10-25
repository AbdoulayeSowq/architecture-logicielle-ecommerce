package com.lms.university.service;

import com.lms.university.dto.TimetableDto;
import java.util.List;

public interface TimetableService {
    TimetableDto createTimetable(TimetableDto timetableDto);
    TimetableDto updateTimetable(Long id, TimetableDto timetableDto);
    void deleteTimetable(Long id);
    TimetableDto getTimetable(Long id);
    List<TimetableDto> getTimetablesByClass(String classId);
    TimetableDto getLatestPublishedTimetable(String classId);
    TimetableDto publishTimetable(Long id);
}
