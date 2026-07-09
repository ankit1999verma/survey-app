package com.gpsurvey.backend.repositories;
import com.gpsurvey.backend.models.Block;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface BlockRepository extends JpaRepository<Block, Long> {
    List<Block> findByDistrictId(Long districtId);
    Page<Block> findByIdGreaterThanOrderByIdAsc(Long id, Pageable pageable);
    long countByIdGreaterThan(Long id);
    
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(MAX(b.id), 0) FROM Block b")
    Long findMaxId();
    
    List<Block> findByIdGreaterThanAndIdLessThanEqualOrderByIdAsc(Long startId, Long endId);
}
