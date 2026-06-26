package com.project.namaste_health_system.service;

import com.project.namaste_health_system.entity.Dispense;
import com.project.namaste_health_system.repository.DispenseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DispenseService {

    private final DispenseRepository dispenseRepository;
    private final PrescriptionService prescriptionService;

    public DispenseService(DispenseRepository dispenseRepository,
                           PrescriptionService prescriptionService) {
        this.dispenseRepository = dispenseRepository;
        this.prescriptionService = prescriptionService;
    }

    public Dispense dispensePrescription(Long prescriptionId, Long chemistId, String notes) {
        // Update prescription status to DISPENSED
        prescriptionService.markDispensed(prescriptionId);

        Dispense dispense = Dispense.builder()
                .prescriptionId(prescriptionId)
                .chemistId(chemistId)
                .notes(notes)
                .build();

        return dispenseRepository.save(dispense);
    }

    public List<Dispense> getDispensesByChemist(Long chemistId) {
        return dispenseRepository.findByChemistId(chemistId);
    }

    public boolean isDispensed(Long prescriptionId) {
        return dispenseRepository.findByPrescriptionId(prescriptionId).isPresent();
    }
}
