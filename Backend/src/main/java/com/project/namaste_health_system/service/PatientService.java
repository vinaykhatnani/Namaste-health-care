package com.project.namaste_health_system.service;

import com.project.namaste_health_system.entity.Patient;
import com.project.namaste_health_system.repository.PatientRepository;
import org.springframework.stereotype.Service;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public Patient register(Patient patient) {
        return patientRepository.save(patient);
    }
}
