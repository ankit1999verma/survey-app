package com.gpsurvey.backend.models;
import jakarta.persistence.*;
import lombok.Data;
@Entity
@Data
public class District {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne
    @JoinColumn(name="state_id")
    private State state;

    @com.fasterxml.jackson.annotation.JsonProperty("stateId")
    public Long getStateId() {
        return state != null ? state.getId() : null;
    }
}
