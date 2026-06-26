package com.project.namaste_health_system.service;

import com.project.namaste_health_system.dto.AuthRequest;
import com.project.namaste_health_system.dto.AuthResponse;
import com.project.namaste_health_system.dto.RegisterRequest;
import com.project.namaste_health_system.entity.DoctorPatientMapping;
import com.project.namaste_health_system.entity.User;
import com.project.namaste_health_system.repository.DoctorPatientMappingRepository;
import com.project.namaste_health_system.repository.UserRepository;
import com.project.namaste_health_system.utility.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final DoctorPatientMappingRepository mappingRepository;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, DoctorPatientMappingRepository mappingRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.mappingRepository = mappingRepository;
    }

    public Long getLoggedInUserId() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(authHeader.substring(7));
        }
        throw new RuntimeException("ACCESS_DENIED");
    }

    public User.Role getLoggedInUserRole() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return User.Role.valueOf(jwtUtil.extractRole(authHeader.substring(7)));
        }
        throw new RuntimeException("ACCESS_DENIED");
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();

        User saved = userRepository.save(user);

        if (request.getRole() == User.Role.PATIENT && request.getDoctorId() != null) {
            User doctor = userRepository.findById(request.getDoctorId())
                    .orElseThrow(() -> new RuntimeException("Doctor not found"));
            if (doctor.getRole() != User.Role.DOCTOR) {
                throw new RuntimeException("Provided ID does not belong to a DOCTOR");
            }

            DoctorPatientMapping mapping = new DoctorPatientMapping();
            mapping.setPatientId(saved.getId());
            mapping.setDoctorId(doctor.getId());
            mapping.setActive(true);
            mapping.setAssignedAt(LocalDateTime.now());
            mapping.setChangedBy(saved.getId()); // Self assigned at registration

            mappingRepository.save(mapping);
        }

        String token = jwtUtil.generateToken(saved);

        return AuthResponse.builder()
                .token(token)
                .userId(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .role(saved.getRole())
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
