package com.project.namaste_health_system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AnalyticsResponse {
    private long totalUsers;
    private long totalPatients;
    private long totalDoctors;
    private long totalChemists;
    private long totalAdmins;
    private long totalDiagnoses;
    private long totalPrescriptions;
    private long pendingPrescriptions;
    private long dispensedPrescriptions;
    private List<Map<String, Object>> diseaseFrequency;
    private List<Map<String, Object>> icdUsage;
}
