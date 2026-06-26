package com.project.namaste_health_system.repository;

import com.project.namaste_health_system.entity.MedicineRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicineRequestRepository extends JpaRepository<MedicineRequest, Long> {
    List<MedicineRequest> findByChemistId(Long chemistId);
    List<MedicineRequest> findByPrescriptionId(Long prescriptionId);
    
    @Query("SELECT mr FROM MedicineRequest mr JOIN Prescription p ON mr.prescriptionId = p.id WHERE p.doctorId = :doctorId ORDER BY mr.createdAt DESC")
    List<MedicineRequest> findByDoctorId(Long doctorId);
}
