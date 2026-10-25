package com.lms.university.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "timetable_entries")
public class TimetableEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "timetable_id")
    private Timetable timetable;

    @Column(nullable = false)
    private String dayOfWeek; // LUNDI, MARDI, MERCREDI, JEUDI, VENDREDI, SAMEDI

    @Column(nullable = false)
    private String startTime; // e.g. "08:00"

    @Column(nullable = false)
    private String endTime;   // e.g. "10:00"

    @Column(nullable = false)
    private String courseName;

    private String teacherName;

    private String type;      // EC, TPE, PROJECT, etc.

    private boolean online = false;
}
