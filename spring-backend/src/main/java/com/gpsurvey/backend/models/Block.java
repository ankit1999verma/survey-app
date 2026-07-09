package com.gpsurvey.backend.models;
import jakarta.persistence.*;
import lombok.Data;
@Entity
@Data
public class Block {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne
    @JoinColumn(name="district_id")
    private District district;

    @com.fasterxml.jackson.annotation.JsonProperty("districtId")
    public Long getDistrictId() {
        return district != null ? district.getId() : null;
    }
}
