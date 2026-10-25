package com.lms.user.repository;

import com.lms.user.entity.UserDeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserDeviceTokenRepository extends JpaRepository<UserDeviceToken, Long> {
    List<UserDeviceToken> findByUsername(String username);
    List<UserDeviceToken> findByUsernameIn(List<String> usernames);
    Optional<UserDeviceToken> findByToken(String token);
}
