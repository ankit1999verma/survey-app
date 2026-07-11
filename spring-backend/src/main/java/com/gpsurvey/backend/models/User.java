package com.gpsurvey.backend.models;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
@Entity
@Data
@Table(name="users") // user is reserved in postgres, safe practice
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique=true, nullable=false)
    private String username;
    
    @Column(nullable=false)
    private String password;
    
    @Column(nullable=false)
    private String name;
    
    private String role = "SURVEYOR"; // SUPER_ADMIN, COMPANY_ADMIN, SURVEYOR
    
    private String contactNo;
    
    @ManyToOne
    @JoinColumn(name="company_id")
    private Company company; // Nullable for SUPER_ADMIN, required for others
    
    private LocalDateTime subscriptionExpiryDate;
}
