package com.lms.user.repository;

import com.lms.user.entity.SystemLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    List<SystemLog> findByUsernameOrderByTimestampDesc(String username);
    List<SystemLog> findAllByOrderByTimestampDesc();
    void deleteByTimestampBefore(java.time.LocalDateTime date);
}
