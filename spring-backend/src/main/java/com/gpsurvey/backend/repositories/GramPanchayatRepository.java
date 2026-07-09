package com.gpsurvey.backend.repositories;
import com.gpsurvey.backend.models.GramPanchayat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface GramPanchayatRepository extends JpaRepository<GramPanchayat, Long> {
    List<GramPanchayat> findByBlockId(Long blockId);
    Page<GramPanchayat> findByIdGreaterThanOrderByIdAsc(Long id, Pageable pageable);
    long countByIdGreaterThan(Long id);
    
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(MAX(g.id), 0) FROM GramPanchayat g")
    Long findMaxId();
    
    List<GramPanchayat> findByIdGreaterThanAndIdLessThanEqualOrderByIdAsc(Long startId, Long endId);
}
