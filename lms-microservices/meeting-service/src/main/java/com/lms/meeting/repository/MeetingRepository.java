package com.lms.meeting.repository;

import com.lms.meeting.entity.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {
    List<Meeting> findByModuleId(Long moduleId);
    List<Meeting> findByModuleIdAndStatus(Long moduleId, String status);
    List<Meeting> findByModuleIdInAndStatus(List<Long> moduleIds, String status);
    Optional<Meeting> findByRoomName(String roomName);
}
