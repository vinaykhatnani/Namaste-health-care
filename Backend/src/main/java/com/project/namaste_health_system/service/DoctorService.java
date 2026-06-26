package com.project.namaste_health_system.service;

import com.project.namaste_health_system.entity.DoctorProfile;
import com.project.namaste_health_system.entity.Diagnosis;
import com.project.namaste_health_system.entity.Prescription;
import com.project.namaste_health_system.repository.DoctorProfileRepository;
import com.project.namaste_health_system.repository.DiagnosisRepository;
import com.project.namaste_health_system.repository.PrescriptionRepository;
import com.project.namaste_health_system.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class DoctorService {

    private final DoctorProfileRepository doctorProfileRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;

    public DoctorService(DoctorProfileRepository doctorProfileRepository,
                         DiagnosisRepository diagnosisRepository,
                         PrescriptionRepository prescriptionRepository,
                         UserRepository userRepository) {
        this.doctorProfileRepository = doctorProfileRepository;
        this.diagnosisRepository = diagnosisRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.userRepository = userRepository;
    }

    public DoctorProfile saveProfile(Long doctorId, DoctorProfile profile) {
        profile.setDoctorId(doctorId);
        Optional<DoctorProfile> existing = doctorProfileRepository.findByDoctorId(doctorId);
        if (existing.isPresent()) {
            DoctorProfile exp = existing.get();
            exp.setHospitalName(profile.getHospitalName());
            exp.setExperience(profile.getExperience());
            exp.setSpecialization(profile.getSpecialization());
            return doctorProfileRepository.save(exp);
        }
        return doctorProfileRepository.save(profile);
    }

    public Optional<DoctorProfile> getProfile(Long doctorId) {
        return doctorProfileRepository.findByDoctorId(doctorId);
    }

    public Map<String, Object> getDoctorDashboard(Long doctorId) {
        long totalDiagnoses = diagnosisRepository.countByDoctorId(doctorId);
        long totalPrescriptions = prescriptionRepository.countByDoctorId(doctorId);
        long activeCases = prescriptionRepository.countByDoctorIdAndStatus(doctorId, Prescription.PrescriptionStatus.PENDING);
        
        List<Diagnosis> recentDiagnoses = diagnosisRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId);
        List<Prescription> recentPrescriptions = prescriptionRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId);

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("totalDiagnoses", totalDiagnoses);
        dashboard.put("totalPrescriptions", totalPrescriptions);
        dashboard.put("activeCases", activeCases);
        dashboard.put("recentDiagnoses", recentDiagnoses);
        dashboard.put("recentPrescriptions", recentPrescriptions);
        dashboard.put("profileComplete", doctorProfileRepository.findByDoctorId(doctorId).isPresent());

        return dashboard;
    }
}
