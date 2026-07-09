package com.gpsurvey.backend.models;
import jakarta.persistence.*;
import lombok.Data;
@Entity
@Data
public class State {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
}
