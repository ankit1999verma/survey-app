package com.gpsurvey.backend.models;
import jakarta.persistence.*;
import lombok.Data;
@Entity
@Data
public class GramPanchayat {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String code;
    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne
    @JoinColumn(name="block_id")
    private Block block;

    @com.fasterxml.jackson.annotation.JsonProperty("blockId")
    public Long getBlockId() {
        return block != null ? block.getId() : null;
    }
}
