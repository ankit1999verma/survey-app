package com.gpsurvey.backend.models;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
@Entity
@Data
public class Survey {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique=true, nullable=false)
    private String uuid;
    
    @ManyToOne
    @JoinColumn(name="company_id", nullable=false)
    private Company company;

    private Long stateId;
    private String stateName;
    private Long districtId;
    private String districtName;
    private Long blockId;
    private String blockName;
    private Long gramPanchayatId;
    private String gramPanchayatName;
    private String gramPanchayatCode;

    private String phase;
    private String surveyVendor;
    private String surveyDate;
    private String surveyDone = "YES";
    @Column(columnDefinition="TEXT")
    private String remarks;

    private String origLocationType;
    private String origInfraStatus;
    private String origElectricity;
    private String origPowerHours;
    private String origSolar;
    private String origEarthing;
    private Double origLat;
    private Double origLong;

    private String currentLocation;
    private String currentPermTemp;
    private Double currentLat;
    private Double currentLong;

    private String gpBhawanAvailable;
    private String gpBhawanInfraStatus;
    private String gpBhawanEnergyMeter;
    private String gpBhawanEarthing;
    private String gpBhawanSolar;
    private Double gpBhawanLat;
    private Double gpBhawanLong;

    private String proposedBuilding;
    private String proposedRackSpace;
    private Double proposedLat;
    private Double proposedLong;
    private String proposedEnergyMeter;
    private String proposedEarthing;
    private String proposedSolar;
    private String proposedPoleLength;
    private Double proposedPoleLat;
    private Double proposedPoleLong;
    @Column(columnDefinition="TEXT")
    private String proposedRemarks;

    private String sarpanchName;
    private String sarpanchContact;

    @Column(columnDefinition="LONGTEXT")
    private String photoBase64;

    @ManyToOne
    @JoinColumn(name="user_id", nullable=false)
    private User user;
    
    private LocalDateTime syncedAt = LocalDateTime.now();
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}
