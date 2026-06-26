package com.project.namaste_health_system.service;

import com.project.namaste_health_system.entity.DoctorPatientMapping;
import com.project.namaste_health_system.exception.AccessDeniedException;
import com.project.namaste_health_system.repository.DoctorPatientMappingRepository;
import org.springframework.stereotype.Service;

@Service
public class AccessControlService {

    private final DoctorPatientMappingRepository mappingRepository;

    public AccessControlService(DoctorPatientMappingRepository mappingRepository) {
        this.mappingRepository = mappingRepository;
    }

    public void validateDoctorAccess(Long doctorId, Long patientId) {
        DoctorPatientMapping mapping = mappingRepository.findByPatientIdAndActiveTrue(patientId)
                .orElseThrow(() -> new AccessDeniedException("No active doctor assigned to this patient"));

        if (!mapping.getDoctorId().equals(doctorId)) {
            throw new AccessDeniedException("Unauthorized doctor access");
        }
    }

    public void validatePatientAccess(Long patientId, Long userId) {
        if (!patientId.equals(userId)) {
            throw new AccessDeniedException("Unauthorized patient access");
        }
    }
}
