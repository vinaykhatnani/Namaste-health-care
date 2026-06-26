package com.project.namaste_health_system.service;

import com.project.namaste_health_system.dto.AnalyticsResponse;
import com.project.namaste_health_system.entity.DoctorProfile;
import com.project.namaste_health_system.entity.Diagnosis;
import com.project.namaste_health_system.entity.Prescription;
import com.project.namaste_health_system.entity.User;
import com.project.namaste_health_system.repository.DoctorProfileRepository;
import com.project.namaste_health_system.repository.DiagnosisRepository;
import com.project.namaste_health_system.repository.PrescriptionRepository;
import com.project.namaste_health_system.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AnalyticsService {

    private final UserRepository userRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    public AnalyticsService(UserRepository userRepository,
                            DiagnosisRepository diagnosisRepository,
                            PrescriptionRepository prescriptionRepository,
                            DoctorProfileRepository doctorProfileRepository) {
        this.userRepository = userRepository;
        this.diagnosisRepository = diagnosisRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.doctorProfileRepository = doctorProfileRepository;
    }

    public List<Map<String, Object>> getDiseaseAnalytics() {
        List<Diagnosis> diagnoses = diagnosisRepository.findAll();
        Map<String, Map<String, Object>> analyticsMap = new HashMap<>();

        for (Diagnosis diag : diagnoses) {
            String disease = diag.getPredictedDisease();
            if (disease == null || disease.isEmpty()) {
                disease = "Unknown";
            }
            
            analyticsMap.computeIfAbsent(disease, k -> {
                Map<String, Object> entry = new HashMap<>();
                entry.put("disease", k);
                entry.put("count", 0);
                entry.put("doctors", new HashSet<Map<String, Object>>());
                entry.put("hospitals", new HashSet<String>());
                entry.put("patients", new HashSet<Map<String, Object>>());
                entry.put("prescriptions", new ArrayList<Map<String, Object>>());
                return entry;
            });

            Map<String, Object> entry = analyticsMap.get(disease);
            entry.put("count", (int) entry.get("count") + 1);

            // Fetch doctor info
            Optional<User> doctorOpt = userRepository.findById(diag.getDoctorId());
            if (doctorOpt.isPresent()) {
                User doc = doctorOpt.get();
                Map<String, Object> docInfo = new HashMap<>();
                docInfo.put("id", doc.getId());
                docInfo.put("name", doc.getName());
                
                // Get profile details
                Optional<DoctorProfile> profileOpt = doctorProfileRepository.findByDoctorId(doc.getId());
                if (profileOpt.isPresent()) {
                    DoctorProfile profile = profileOpt.get();
                    docInfo.put("specialization", profile.getSpecialization());
                    docInfo.put("experience", profile.getExperience());
                    docInfo.put("hospitalName", profile.getHospitalName());
                    ((Set<String>) entry.get("hospitals")).add(profile.getHospitalName());
                } else {
                    docInfo.put("specialization", "N/A");
                    docInfo.put("experience", "N/A");
                    docInfo.put("hospitalName", "Unknown Hospital");
                }
                ((Set<Map<String, Object>>) entry.get("doctors")).add(docInfo);
            }

            // Fetch patient info
            Optional<User> patientOpt = userRepository.findById(diag.getPatientId());
            if (patientOpt.isPresent()) {
                User pat = patientOpt.get();
                Map<String, Object> patInfo = new HashMap<>();
                patInfo.put("id", pat.getId());
                patInfo.put("name", pat.getName());
                patInfo.put("email", pat.getEmail());
                ((Set<Map<String, Object>>) entry.get("patients")).add(patInfo);
            }

            // Fetch associated prescriptions
            List<Prescription> preList = prescriptionRepository.findByDiagnosisId(diag.getId());
            for (Prescription p : preList) {
                Map<String, Object> pInfo = new HashMap<>();
                pInfo.put("id", p.getId());
                pInfo.put("medicines", p.getMedicines());
                pInfo.put("notes", p.getNotes());
                pInfo.put("status", p.getStatus());
                ((List<Map<String, Object>>) entry.get("prescriptions")).add(pInfo);
            }
        }

        List<Map<String, Object>> result = new ArrayList<>(analyticsMap.values());
        result.sort((a, b) -> Integer.compare((int) b.get("count"), (int) a.get("count")));
        return result;
    }

    public AnalyticsResponse getAnalytics() {
        List<Object[]> diseaseFreqRaw = diagnosisRepository.getDiseaseFrequency();
        List<Map<String, Object>> diseaseFrequency = new ArrayList<>();
        for (Object[] row : diseaseFreqRaw) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("disease", row[0]);
            entry.put("count", row[1]);
            diseaseFrequency.add(entry);
        }

        List<Object[]> icdUsageRaw = diagnosisRepository.getIcdUsage();
        List<Map<String, Object>> icdUsage = new ArrayList<>();
        for (Object[] row : icdUsageRaw) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("icdCode", row[0]);
            entry.put("count", row[1]);
            icdUsage.add(entry);
        }

        return AnalyticsResponse.builder()
                .totalUsers(userRepository.count())
                .totalPatients(userRepository.countByRole(User.Role.PATIENT))
                .totalDoctors(userRepository.countByRole(User.Role.DOCTOR))
                .totalChemists(userRepository.countByRole(User.Role.CHEMIST))
                .totalAdmins(userRepository.countByRole(User.Role.ADMIN))
                .totalDiagnoses(diagnosisRepository.count())
                .totalPrescriptions(prescriptionRepository.count())
                .pendingPrescriptions(prescriptionRepository.countByStatus(Prescription.PrescriptionStatus.PENDING))
                .dispensedPrescriptions(prescriptionRepository.countByStatus(Prescription.PrescriptionStatus.DISPENSED))
                .diseaseFrequency(diseaseFrequency)
                .icdUsage(icdUsage)
                .build();
    }
}
