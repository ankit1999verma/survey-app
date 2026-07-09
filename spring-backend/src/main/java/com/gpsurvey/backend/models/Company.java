package com.gpsurvey.backend.models;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Company {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique=true, nullable=false)
    private String name;
    
    private String subscriptionStatus = "INACTIVE"; // ACTIVE, INACTIVE
    private String subscriptionPlan = "NONE";
    
    private LocalDateTime createdAt = LocalDateTime.now();
}
