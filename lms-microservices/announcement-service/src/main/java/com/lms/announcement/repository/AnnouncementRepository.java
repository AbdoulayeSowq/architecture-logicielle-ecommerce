package com.lms.announcement.repository;

import com.lms.announcement.entity.Announcement;
import com.lms.announcement.entity.TargetAudience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findAllByType(String type);

    /** Annonces par audience exacte (ex: STUDENTS, LECTURERS, ALL) */
    List<Announcement> findAllByTargetAudience(TargetAudience targetAudience);

    /** Annonces ciblant une audience + un ID (COURSE ou CLASS) */
    List<Announcement> findAllByTargetAudienceAndTargetId(TargetAudience targetAudience, String targetId);

    /**
     * Récupère toutes les annonces visibles par un étudiant d'un ensemble de cours et de classes.
     * Inclut : ALL + STUDENTS + les annonces de ses cours + les annonces de ses classes.
     */
    @Query("SELECT a FROM Announcement a WHERE " +
           "a.targetAudience = 'ALL' OR " +
           "a.targetAudience = 'STUDENTS' OR " +
           "(a.targetAudience = 'COURSE' AND a.targetId IN :courseCodes) OR " +
           "(a.targetAudience = 'CLASS' AND a.targetId IN :classIds)")
    List<Announcement> findAnnouncementsForStudent(@Param("courseCodes") List<String> courseCodes,
                                                   @Param("classIds") List<String> classIds);

    /**
     * Récupère toutes les annonces visibles par un enseignant donné, filtrées sur son périmètre.
     * Inclut : ALL + LECTURERS + les annonces de ses classes + les annonces de ses cours + les siennes.
     */
    @Query("SELECT a FROM Announcement a WHERE " +
           "a.targetAudience = 'ALL' OR " +
           "a.targetAudience = 'LECTURERS' OR " +
           "(a.targetAudience = 'CLASS' AND a.targetId IN :classIds) OR " +
           "(a.targetAudience = 'COURSE' AND a.targetId IN :courseCodes) OR " +
           "a.assignmentInstructor = :username OR " +
           "a.eventOrganizer = :username OR " +
           "a.examInstructor = :username")
    List<Announcement> findAnnouncementsForLecturer(@Param("classIds") List<String> classIds,
                                                    @Param("courseCodes") List<String> courseCodes,
                                                    @Param("username") String username);
}

