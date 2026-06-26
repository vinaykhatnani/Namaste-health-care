package com.project.namaste_health_system.service;

import com.project.namaste_health_system.entity.DoctorPatientMapping;
import com.project.namaste_health_system.entity.User;
import com.project.namaste_health_system.exception.AccessDeniedException;
import com.project.namaste_health_system.repository.DoctorPatientMappingRepository;
import com.project.namaste_health_system.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ChangeDoctorService {

    private final DoctorPatientMappingRepository mappingRepository;
    private final AuthService authService;
    private final AccessControlService accessControlService;
    private final UserRepository userRepository;

    public ChangeDoctorService(DoctorPatientMappingRepository mappingRepository,
                               AuthService authService,
                               AccessControlService accessControlService,
                               UserRepository userRepository) {
        this.mappingRepository = mappingRepository;
        this.authService = authService;
        this.accessControlService = accessControlService;
        this.userRepository = userRepository;
    }

    @Transactional
    public void changeDoctor(Long patientId, Long newDoctorId) {
        Long userId = authService.getLoggedInUserId();
        User.Role role = authService.getLoggedInUserRole();

        if (!(role == User.Role.PATIENT || role == User.Role.ADMIN)) {
            throw new AccessDeniedException("Only PATIENT or ADMIN can change doctor assignments");
        }

        if (role == User.Role.PATIENT) {
            accessControlService.validatePatientAccess(patientId, userId);
        }

        // Validate doctor exists
        User newDoctor = userRepository.findById(newDoctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (newDoctor.getRole() != User.Role.DOCTOR) {
            throw new RuntimeException("Provided ID does not belong to a DOCTOR");
        }

        DoctorPatientMapping current = mappingRepository.findByPatientIdAndActiveTrue(patientId)
                .orElse(null);

        if (current != null) {
            if (current.getDoctorId().equals(newDoctorId)) {
                throw new RuntimeException("Already assigned to this doctor");
            }
            // Deactivate old
            current.setActive(false);
            current.setRemovedAt(LocalDateTime.now());
            current.setChangedBy(userId);
            mappingRepository.save(current);
        }

        // Create new
        DoctorPatientMapping newMapping = new DoctorPatientMapping();
        newMapping.setPatientId(patientId);
        newMapping.setDoctorId(newDoctorId);
        newMapping.setActive(true);
        newMapping.setAssignedAt(LocalDateTime.now());
        newMapping.setChangedBy(userId);

        mappingRepository.save(newMapping);
    }
}
