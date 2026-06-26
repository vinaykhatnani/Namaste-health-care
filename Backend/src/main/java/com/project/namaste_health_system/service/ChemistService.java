package com.project.namaste_health_system.service;

import com.project.namaste_health_system.entity.ChemistProfile;
import com.project.namaste_health_system.entity.MedicineRequest;
import com.project.namaste_health_system.entity.DispenseIssue;
import com.project.namaste_health_system.repository.ChemistProfileRepository;
import com.project.namaste_health_system.repository.MedicineRequestRepository;
import com.project.namaste_health_system.repository.DispenseIssueRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ChemistService {

    private final ChemistProfileRepository chemistProfileRepository;
    private final MedicineRequestRepository medicineRequestRepository;
    private final DispenseIssueRepository dispenseIssueRepository;

    public ChemistService(ChemistProfileRepository chemistProfileRepository,
                          MedicineRequestRepository medicineRequestRepository,
                          DispenseIssueRepository dispenseIssueRepository) {
        this.chemistProfileRepository = chemistProfileRepository;
        this.medicineRequestRepository = medicineRequestRepository;
        this.dispenseIssueRepository = dispenseIssueRepository;
    }

    public ChemistProfile saveProfile(Long chemistId, ChemistProfile profile) {
        profile.setChemistId(chemistId);
        Optional<ChemistProfile> existing = chemistProfileRepository.findByChemistId(chemistId);
        if (existing.isPresent()) {
            ChemistProfile exp = existing.get();
            exp.setHospitalName(profile.getHospitalName());
            return chemistProfileRepository.save(exp);
        }
        return chemistProfileRepository.save(profile);
    }

    public Optional<ChemistProfile> getProfile(Long chemistId) {
        return chemistProfileRepository.findByChemistId(chemistId);
    }

    // Medicine requests
    public MedicineRequest requestMedicineChange(Long chemistId, MedicineRequest request) {
        request.setChemistId(chemistId);
        request.setStatus(MedicineRequest.RequestStatus.PENDING);
        return medicineRequestRepository.save(request);
    }

    public List<MedicineRequest> getRequestsForDoctor(Long doctorId) {
        return medicineRequestRepository.findByDoctorId(doctorId);
    }

    public List<MedicineRequest> getRequestsForChemist(Long chemistId) {
        return medicineRequestRepository.findByChemistId(chemistId);
    }

    public MedicineRequest respondToRequest(Long requestId, MedicineRequest.RequestStatus status) {
        MedicineRequest req = medicineRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found with id: " + requestId));
        req.setStatus(status);
        return medicineRequestRepository.save(req);
    }

    // Dispense issues
    public DispenseIssue reportIssue(Long chemistId, DispenseIssue issue) {
        issue.setChemistId(chemistId);
        issue.setStatus(DispenseIssue.IssueStatus.PENDING);
        return dispenseIssueRepository.save(issue);
    }

    public List<DispenseIssue> getAllIssues() {
        return dispenseIssueRepository.findAllByOrderByCreatedAtDesc();
    }

    public DispenseIssue resolveIssue(Long issueId, DispenseIssue.IssueStatus status) {
        DispenseIssue issue = dispenseIssueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue not found with id: " + issueId));
        issue.setStatus(status);
        return dispenseIssueRepository.save(issue);
    }
}
