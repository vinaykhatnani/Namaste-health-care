package com.project.namaste_health_system.repository;

import com.project.namaste_health_system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(User.Role role);
    boolean existsByEmail(String email);
    long countByRole(User.Role role);
}
