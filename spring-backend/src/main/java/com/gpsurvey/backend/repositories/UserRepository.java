package com.gpsurvey.backend.repositories;
import com.gpsurvey.backend.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameOrContactNo(String username, String contactNo);
}
