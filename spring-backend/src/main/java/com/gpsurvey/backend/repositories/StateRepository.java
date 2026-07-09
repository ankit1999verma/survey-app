package com.gpsurvey.backend.repositories;
import com.gpsurvey.backend.models.State;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface StateRepository extends JpaRepository<State, Long> {
    List<State> findByIdGreaterThan(Long id);
}
