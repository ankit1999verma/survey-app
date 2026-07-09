package com.gpsurvey.backend.dto;
import lombok.Data;
import lombok.AllArgsConstructor;
@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String role;
    private Long companyId;
}
