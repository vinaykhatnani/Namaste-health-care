package com.project.namaste_health_system.dto;

import lombok.Data;

@Data
public class FeedbackRequest {
    private String symptoms;
    private String correctIcdCode;
    private String correctDisease;
    private Long doctorId;
}
