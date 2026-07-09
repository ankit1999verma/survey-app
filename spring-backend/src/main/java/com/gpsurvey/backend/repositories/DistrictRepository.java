package com.gpsurvey.backend.repositories;
import com.gpsurvey.backend.models.District;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface DistrictRepository extends JpaRepository<District, Long> {
    List<District> findByStateId(Long stateId);
    List<District> findByIdGreaterThan(Long id);
}
