package com.project.namaste_health_system.controller;

import com.project.namaste_health_system.entity.User;
import com.project.namaste_health_system.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final com.project.namaste_health_system.service.ChangeDoctorService changeDoctorService;

    public UserController(UserService userService, com.project.namaste_health_system.service.ChangeDoctorService changeDoctorService) {
        this.userService = userService;
        this.changeDoctorService = changeDoctorService;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable String role) {
        try {
            User.Role userRole = User.Role.valueOf(role.toUpperCase());
            return ResponseEntity.ok(userService.getUsersByRole(userRole));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(userService.getUserById(id));
        } catch (com.project.namaste_health_system.exception.AccessDeniedException e) {
            return ResponseEntity.status(403).body(Map.of("error", "ACCESS_DENIED", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/change-doctor")
    public ResponseEntity<?> changeDoctor(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        try {
            Long newDoctorId = payload.get("newDoctorId");
            if (newDoctorId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "newDoctorId is required"));
            }
            changeDoctorService.changeDoctor(id, newDoctorId);
            return ResponseEntity.ok(Map.of("message", "Doctor changed successfully"));
        } catch (com.project.namaste_health_system.exception.AccessDeniedException e) {
            return ResponseEntity.status(403).body(Map.of("error", "ACCESS_DENIED", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
