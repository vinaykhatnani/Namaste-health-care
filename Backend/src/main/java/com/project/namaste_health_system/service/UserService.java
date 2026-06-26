package com.project.namaste_health_system.service;

import com.project.namaste_health_system.entity.User;
import com.project.namaste_health_system.repository.UserRepository;
import com.project.namaste_health_system.repository.DoctorProfileRepository;
import com.project.namaste_health_system.repository.ChemistProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final ChemistProfileRepository chemistProfileRepository;

    private final AuthService authService;
    private final AccessControlService accessControlService;
    private final com.project.namaste_health_system.repository.DoctorPatientMappingRepository mappingRepository;

    public UserService(UserRepository userRepository,
                       DoctorProfileRepository doctorProfileRepository,
                       ChemistProfileRepository chemistProfileRepository,
                       AuthService authService,
                       AccessControlService accessControlService,
                       com.project.namaste_health_system.repository.DoctorPatientMappingRepository mappingRepository) {
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.chemistProfileRepository = chemistProfileRepository;
        this.authService = authService;
        this.accessControlService = accessControlService;
        this.mappingRepository = mappingRepository;
    }

    private void enrichUser(User user) {
        if (user == null) return;
        if (user.getRole() == User.Role.DOCTOR) {
            doctorProfileRepository.findByDoctorId(user.getId())
                    .ifPresent(p -> user.setHospitalName(p.getHospitalName()));
        } else if (user.getRole() == User.Role.CHEMIST) {
            chemistProfileRepository.findByChemistId(user.getId())
                    .ifPresent(p -> user.setHospitalName(p.getHospitalName()));
        } else if (user.getRole() == User.Role.PATIENT) {
            mappingRepository.findByPatientIdAndActiveTrue(user.getId()).ifPresent(mapping -> {
                user.setAssignedDoctorId(mapping.getDoctorId());
                userRepository.findById(mapping.getDoctorId()).ifPresent(doc -> {
                    user.setAssignedDoctorName(doc.getName());
                });
            });
        }
    }

    private List<User> enrichUsers(List<User> list) {
        list.forEach(this::enrichUser);
        return list;
    }

    public List<User> getAllUsers() {
        return enrichUsers(userRepository.findAll());
    }

    public List<User> getUsersByRole(User.Role role) {
        if (role == User.Role.PATIENT && authService.getLoggedInUserRole() == User.Role.DOCTOR) {
            Long doctorId = authService.getLoggedInUserId();
            List<com.project.namaste_health_system.entity.DoctorPatientMapping> mappings = mappingRepository.findByDoctorIdAndActiveTrue(doctorId);
            List<Long> patientIds = mappings.stream().map(com.project.namaste_health_system.entity.DoctorPatientMapping::getPatientId).toList();
            return enrichUsers(userRepository.findAllById(patientIds));
        }
        return enrichUsers(userRepository.findByRole(role));
    }

    public User getUserById(Long id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // If the requested user is a PATIENT, enforce access control
        if (u.getRole() == User.Role.PATIENT) {
            Long loggedInUserId = authService.getLoggedInUserId();
            User.Role role = authService.getLoggedInUserRole();

            if (role == User.Role.DOCTOR) {
                accessControlService.validateDoctorAccess(loggedInUserId, id);
            } else if (role == User.Role.PATIENT) {
                accessControlService.validatePatientAccess(id, loggedInUserId);
            }
        }

        enrichUser(u);
        return u;
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }
}
