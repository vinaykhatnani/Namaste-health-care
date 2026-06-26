package com.project.namaste_health_system.service;

import com.project.namaste_health_system.dto.DiagnosisRequest;
import com.project.namaste_health_system.dto.MLPredictionItem;
import com.project.namaste_health_system.entity.Diagnosis;
import com.project.namaste_health_system.entity.DoctorProfile;
import com.project.namaste_health_system.entity.Prescription;
import com.project.namaste_health_system.entity.User;
import com.project.namaste_health_system.repository.DiagnosisRepository;
import com.project.namaste_health_system.repository.UserRepository;
import com.project.namaste_health_system.repository.DoctorProfileRepository;
import com.project.namaste_health_system.repository.PrescriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * DiagnosisService — Phase 3 Upgrade
 * ====================================
 * Now calls mlService.predictAll() to get the FULL top-3 predictions list.
 * The top prediction is saved to the database.
 * All 3 predictions (with real dynamic confidences) are attached to the response.
 */
@Service
public class DiagnosisService {

    private static final Logger logger = LoggerFactory.getLogger(DiagnosisService.class);

    private final DiagnosisRepository diagnosisRepository;
    private final UserRepository userRepository;
    private final PredictionService predictionService;
    private final ICDService icdService;
    private final ExplanationService explanationService;
    private final InsuranceService insuranceService;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final DiseaseNormalizationService normalizationService;
    private final ObjectMapper objectMapper;
    private final AuthService authService;
    private final AccessControlService accessControlService;

    public DiagnosisService(DiagnosisRepository diagnosisRepository,
                            UserRepository userRepository,
                            PredictionService predictionService,
                            ICDService icdService,
                            ExplanationService explanationService,
                            InsuranceService insuranceService,
                            DoctorProfileRepository doctorProfileRepository,
                            PrescriptionRepository prescriptionRepository,
                            DiseaseNormalizationService normalizationService,
                            ObjectMapper objectMapper,
                            AuthService authService,
                            AccessControlService accessControlService) {
        this.diagnosisRepository = diagnosisRepository;
        this.userRepository = userRepository;
        this.predictionService = predictionService;
        this.icdService = icdService;
        this.explanationService = explanationService;
        this.insuranceService = insuranceService;
        this.doctorProfileRepository = doctorProfileRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.normalizationService = normalizationService;
        this.objectMapper = objectMapper;
        this.authService = authService;
        this.accessControlService = accessControlService;
    }

    private String serializeToJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            logger.error("Failed to serialize object to JSON: {}", e.getMessage());
            return null;
        }
    }

    private void enrichDiagnosis(Diagnosis diagnosis) {
        if (diagnosis == null) return;
        userRepository.findById(diagnosis.getDoctorId()).ifPresent(doc -> {
            diagnosis.setDoctorName(doc.getName());
            doctorProfileRepository.findByDoctorId(doc.getId()).ifPresent(prof -> {
                diagnosis.setHospitalName(prof.getHospitalName());
            });
        });
        List<Prescription> prescriptions = prescriptionRepository.findByDiagnosisId(diagnosis.getId());
        if (!prescriptions.isEmpty()) {
            StringBuilder meds = new StringBuilder();
            for (Prescription p : prescriptions) {
                if (meds.length() > 0) meds.append("; ");
                meds.append(p.getMedicines());
            }
            diagnosis.setMedicines(meds.toString());
        }
    }

    private List<Diagnosis> enrichDiagnoses(List<Diagnosis> list) {
        list.forEach(this::enrichDiagnosis);
        return list;
    }

    public Diagnosis createDiagnosis(Long doctorId, DiagnosisRequest request) {
        Long loggedInUserId = authService.getLoggedInUserId();
        com.project.namaste_health_system.entity.User.Role role = authService.getLoggedInUserRole();

        // Verify patient exists
        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found with id: " + request.getPatientId()));

        if (role == com.project.namaste_health_system.entity.User.Role.DOCTOR) {
            accessControlService.validateDoctorAccess(loggedInUserId, patient.getId());
            // Enforce that the doctorId creating the diagnosis is the logged in doctor
            if (!loggedInUserId.equals(doctorId)) {
                throw new com.project.namaste_health_system.exception.AccessDeniedException("Cannot create diagnosis for another doctor");
            }
        } else if (role == com.project.namaste_health_system.entity.User.Role.PATIENT) {
            accessControlService.validatePatientAccess(patient.getId(), loggedInUserId);
        }

        String symptoms = request.getSymptoms();
        if (symptoms == null || symptoms.trim().isEmpty()) {
            throw new IllegalArgumentException("Symptoms cannot be empty");
        }
        if (symptoms.length() > 200) {
            throw new IllegalArgumentException("Input too long");
        }
        if (!symptoms.matches(".*\\p{L}.*")) {
            throw new IllegalArgumentException("Invalid symptoms input");
        }
        logger.info("Symptoms Input: {}", symptoms);

        // Phase 1: Log optional doctor disease input
        String doctorInput = request.getDiseaseName();
        String language = request.getLanguage();
        if (doctorInput != null && !doctorInput.isBlank()) {
            logger.info("Doctor Disease Input: '{}', Language: '{}'", doctorInput, language);
        }

        // Phase 2: Normalize the disease input (LOG ONLY — not used in ML yet)
        String normalizedDisease = normalizationService.normalizeDisease(doctorInput);
        logger.info("Original Input: {}", doctorInput);
        logger.info("Normalized Disease: {}", normalizedDisease);

        // ─── Phase 3: Get FULL top-3 ML predictions (real dynamic confidence) ───
        long startTime = System.currentTimeMillis();
        PredictionService.MLResponse mlResponse = null;
        List<MLPredictionItem> allPredictions = new java.util.ArrayList<>();
        
        String severity = request.getSeverity();
        String duration = request.getDuration();
        
        try {
            // STEP 1: Prediction Service
            mlResponse = predictionService.predictAll(request.getSymptoms(), normalizedDisease, language, severity, duration);
            if (mlResponse != null && mlResponse.getPredictions() != null) {
                allPredictions = mlResponse.getPredictions();
                
                // Orchestrate Helper Services cleanly for each prediction
                for (MLPredictionItem item : allPredictions) {
                    // STEP 3: Explanation Service (Formatted from ML output)
                    item.setExplanation(explanationService.build(item));
                    
                    // STEP 4: Insurance Service (Formatted from ML output)
                    item.setInsuranceInsights(insuranceService.buildInsurance(item));
                    item.setErtcInsights(insuranceService.buildERTC(item));
                }
            }
        } catch (Exception e) {
            logger.error("ML Prediction Failed: {}", e.getMessage());
        }
        
        long latency = System.currentTimeMillis() - startTime;
        logger.info("ML API Latency: {} ms for symptoms: {}", latency, request.getSymptoms());

        if (!allPredictions.isEmpty()) {
            logger.info("Top ML Predictions: {}", allPredictions);
        } else {
            logger.warn("No ML Predictions retrieved, using fallback.");
        }

        // Use top prediction for DB persistence (backward-compatible)
        PredictionService.MLPrediction prediction = new PredictionService.MLPrediction();
        if (!allPredictions.isEmpty()) {
            MLPredictionItem top = allPredictions.get(0);
            prediction.setDisease(top.getDisease());
            prediction.setIcdCode(top.getIcdCode());
            prediction.setConfidence(top.getConfidence());
            prediction.setNamasteCode(top.getNamasteCode());
            prediction.setNamasteTerm(top.getNamasteTerm());
            prediction.setEnglishDisease(top.getEnglishDisease());
            
            logger.info("Top Prediction: {}", top.getDisease());
            logger.info("Confidence: {}", top.getConfidence());
        } else {
            prediction.setDisease("Insufficient Data");
            prediction.setIcdCode("N/A");
            prediction.setConfidence(0.0);
            prediction.setNamasteCode("N/A");
            prediction.setNamasteTerm("N/A");
            prediction.setEnglishDisease("Insufficient Data");
        }

        // Try live WHO ICD-11 API first
        ICDService.ICDResult icdResult = icdService.lookupDisease(prediction.getEnglishDisease());
        String icdCode = icdResult != null ? icdResult.code() : null;
        String icdTitle = icdResult != null ? icdResult.title() : null;

        // Fall back to local CSV pre-mapped code if WHO API fails
        if (icdCode == null || icdCode.equals("N/A")) {
            icdCode = prediction.getIcdCode();
            icdTitle = prediction.getEnglishDisease();
        }
        
        // ICD Validation (NON-BLOCKING)
        if (icdCode == null || icdCode.trim().length() < 2 || icdCode.equals("N/A") || icdCode.equals("Unknown")) {
            logger.warn("Invalid ICD detected: {}", icdCode);
            icdCode = "N/A";
        }

        // Format predictedDisease: "Namaste term [NAMC: code] - English name"
        String formattedDisease = String.format("%s [NAMC: %s] - %s",
                prediction.getNamasteTerm(), prediction.getNamasteCode(), prediction.getEnglishDisease());

        Diagnosis diagnosis = Diagnosis.builder()
                .patientId(request.getPatientId())
                .doctorId(doctorId)
                .symptoms(request.getSymptoms())
                .predictedDisease(formattedDisease)
                .icdCode(icdCode)
                .icdTitle(icdTitle)
                .confidenceScore(prediction.getConfidence())
                .aiExplanationJson(serializeToJson(allPredictions.isEmpty() ? null : allPredictions.get(0).getExplanation()))
                .ertcJson(serializeToJson(allPredictions.isEmpty() ? null : allPredictions.get(0).getErtcInsights()))
                .insuranceJson(serializeToJson(allPredictions.isEmpty() ? null : allPredictions.get(0).getInsuranceInsights()))
                .build();
                
        // Store Top 3 Predictions in mapped entity
        for (MLPredictionItem item : allPredictions) {
            com.project.namaste_health_system.entity.DiagnosisPrediction dp = new com.project.namaste_health_system.entity.DiagnosisPrediction();
            dp.setDiagnosis(diagnosis);
            dp.setDisease(item.getDisease());
            dp.setIcdCode(item.getIcdCode());
            dp.setConfidence(item.getConfidence());
            diagnosis.getPredictions().add(dp);
        }

        Diagnosis saved = diagnosisRepository.save(diagnosis);
        enrichDiagnosis(saved);

        // Phase 3: Attach the full top-3 predictions list to the API response
        saved.setMlPredictions(allPredictions);
        if (mlResponse != null) {
            saved.setTraceId(mlResponse.getTraceId());
            saved.setModelVersion(mlResponse.getModelVersion());
            saved.setLatencyMs(mlResponse.getLatencyMs());
            if (mlResponse.getMessage() != null && mlResponse.getMessage().equals("ML service unavailable")) {
                logger.warn("ML Service was unavailable, returning fallback state.");
            }
        }

        return saved;
    }

    public List<Diagnosis> getDiagnosesForPatient(Long patientId) {
        Long loggedInUserId = authService.getLoggedInUserId();
        com.project.namaste_health_system.entity.User.Role role = authService.getLoggedInUserRole();

        if (role == com.project.namaste_health_system.entity.User.Role.DOCTOR) {
            accessControlService.validateDoctorAccess(loggedInUserId, patientId);
        } else if (role == com.project.namaste_health_system.entity.User.Role.PATIENT) {
            accessControlService.validatePatientAccess(patientId, loggedInUserId);
        }

        return enrichDiagnoses(diagnosisRepository.findByPatientIdOrderByCreatedAtDesc(patientId));
    }

    public List<Diagnosis> getDiagnosesForDoctor(Long doctorId) {
        return enrichDiagnoses(diagnosisRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId));
    }

    public List<Diagnosis> getAllDiagnoses() {
        return enrichDiagnoses(diagnosisRepository.findAllByOrderByCreatedAtDesc());
    }

    public Diagnosis getDiagnosisById(Long id) {
        Diagnosis d = diagnosisRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Diagnosis not found with id: " + id));

        Long loggedInUserId = authService.getLoggedInUserId();
        com.project.namaste_health_system.entity.User.Role role = authService.getLoggedInUserRole();

        if (role == com.project.namaste_health_system.entity.User.Role.DOCTOR) {
            accessControlService.validateDoctorAccess(loggedInUserId, d.getPatientId());
        } else if (role == com.project.namaste_health_system.entity.User.Role.PATIENT) {
            accessControlService.validatePatientAccess(d.getPatientId(), loggedInUserId);
        }

        enrichDiagnosis(d);
        return d;
    }
}
