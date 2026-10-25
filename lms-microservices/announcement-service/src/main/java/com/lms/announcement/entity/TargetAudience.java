package com.lms.announcement.entity;

/**
 * Defines who an announcement targets.
 *
 * ALL         → toute la plateforme
 * STUDENTS    → tous les étudiants
 * LECTURERS   → tous les enseignants
 * COURSE      → étudiants inscrits à un cours spécifique (targetId = courseCode)
 * CLASS       → étudiants d'une classe spécifique  (targetId = classId)
 */
public enum TargetAudience {
    ALL,
    STUDENTS,
    LECTURERS,
    COURSE,
    CLASS
}
