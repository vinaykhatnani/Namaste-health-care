package com.project.namaste_health_system.service;

import com.project.namaste_health_system.dto.PrescriptionRequest;
import com.project.namaste_health_system.entity.Prescription;
import com.project.namaste_health_system.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AuthService authService;
    private final AccessControlService accessControlService;

    public PrescriptionService(PrescriptionRepository prescriptionRepository, AuthService authService, AccessControlService accessControlService) {
        this.prescriptionRepository = prescriptionRepository;
        this.authService = authService;
        this.accessControlService = accessControlService;
    }

    public Prescription createPrescription(Long doctorId, PrescriptionRequest request) {
        Long loggedInUserId = authService.getLoggedInUserId();
        com.project.namaste_health_system.entity.User.Role role = authService.getLoggedInUserRole();

        if (role == com.project.namaste_health_system.entity.User.Role.DOCTOR) {
            accessControlService.validateDoctorAccess(loggedInUserId, request.getPatientId());
            if (!loggedInUserId.equals(doctorId)) {
                throw new com.project.namaste_health_system.exception.AccessDeniedException("Cannot create prescription for another doctor");
            }
        } else if (role == com.project.namaste_health_system.entity.User.Role.PATIENT) {
            throw new com.project.namaste_health_system.exception.AccessDeniedException("Patients cannot create prescriptions");
        }

        Prescription prescription = Prescription.builder()
                .diagnosisId(request.getDiagnosisId())
                .doctorId(doctorId)
                .patientId(request.getPatientId())
                .medicines(request.getMedicines())
                .notes(request.getNotes())
                .status(Prescription.PrescriptionStatus.PENDING)
                .build();

        return prescriptionRepository.save(prescription);
    }

    public List<Prescription> getAllPrescriptions() {
        return prescriptionRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Prescription> getPendingPrescriptions() {
        return prescriptionRepository.findByStatus(Prescription.PrescriptionStatus.PENDING);
    }

    public List<Prescription> getPrescriptionsForPatient(Long patientId) {
        Long loggedInUserId = authService.getLoggedInUserId();
        com.project.namaste_health_system.entity.User.Role role = authService.getLoggedInUserRole();

        if (role == com.project.namaste_health_system.entity.User.Role.DOCTOR) {
            accessControlService.validateDoctorAccess(loggedInUserId, patientId);
        } else if (role == com.project.namaste_health_system.entity.User.Role.PATIENT) {
            accessControlService.validatePatientAccess(patientId, loggedInUserId);
        }

        return prescriptionRepository.findByPatientId(patientId);
    }

    public List<Prescription> getPrescriptionsForDiagnosis(Long diagnosisId) {
        return prescriptionRepository.findByDiagnosisId(diagnosisId);
    }

    public Prescription getPrescriptionById(Long id) {
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with id: " + id));

        Long loggedInUserId = authService.getLoggedInUserId();
        com.project.namaste_health_system.entity.User.Role role = authService.getLoggedInUserRole();

        if (role == com.project.namaste_health_system.entity.User.Role.DOCTOR) {
            accessControlService.validateDoctorAccess(loggedInUserId, p.getPatientId());
        } else if (role == com.project.namaste_health_system.entity.User.Role.PATIENT) {
            accessControlService.validatePatientAccess(p.getPatientId(), loggedInUserId);
        }

        return p;
    }

    public Prescription markDispensed(Long id) {
        Prescription prescription = getPrescriptionById(id);
        prescription.setStatus(Prescription.PrescriptionStatus.DISPENSED);
        return prescriptionRepository.save(prescription);
    }
}
