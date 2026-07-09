package com.gpsurvey.backend.dto;
import lombok.Data;
@Data
public class CompanyRegistrationRequest {
    private String companyName;
    private String adminUsername;
    private String adminPassword;
    private String adminName;
    private String adminContactNo;
}
