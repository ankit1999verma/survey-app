package com.gpsurvey.backend.dto;
import lombok.Data;
@Data
public class WorkerInviteRequest {
    private String username;
    private String password;
    private String name;
    private String contactNo;
}
