package com.lms.user.repository;

import com.lms.user.entity.Mentorship;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MentorshipRepository extends JpaRepository<Mentorship, Long> {
    List<Mentorship> findByMentorUsername(String username);
    List<Mentorship> findByMenteeUsername(String username);
    List<Mentorship> findByModuleId(Long moduleId);
    boolean existsByMentorUsernameAndMenteeUsernameAndModuleIdAndStatusIn(
            String mentorUsername, String menteeUsername, Long moduleId, List<String> statuses);
    boolean existsByMentorUsernameAndMenteeUsernameAndModuleIdAndMentorRoleAndStatusIn(
            String mentorUsername, String menteeUsername, Long moduleId, String mentorRole, List<String> statuses);
}
