package com.gpsurvey.backend.repositories;
import com.gpsurvey.backend.models.Survey;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;

public interface SurveyRepository extends JpaRepository<Survey, Long> {
    Optional<Survey> findByUuid(String uuid);
    List<Survey> findByCompanyId(Long companyId);

    // Mobile App Cursor Pagination (Date-based)
    Page<Survey> findByUserIdAndCreatedAtGreaterThanOrderByCreatedAtAsc(Long userId, LocalDateTime date, Pageable pageable);
    long countByUserIdAndCreatedAtGreaterThan(Long userId, LocalDateTime date);

    // Admin Panel Cursor Pagination (ID-based)
    Page<Survey> findByIdGreaterThanOrderByIdAsc(Long id, Pageable pageable);
    long countByIdGreaterThan(Long id);

    Page<Survey> findByCompanyIdAndIdGreaterThanOrderByIdAsc(Long companyId, Long id, Pageable pageable);
    long countByCompanyIdAndIdGreaterThan(Long companyId, Long id);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) FROM Survey s WHERE s.user.id = :userId " +
            "AND (:stateId IS NULL OR s.stateId = :stateId) " +
            "AND (:districtId IS NULL OR s.districtId = :districtId) " +
            "AND (:blockId IS NULL OR s.blockId = :blockId)")
    long countSurveysWithFilters(@org.springframework.data.repository.query.Param("userId") Long userId,
                                 @org.springframework.data.repository.query.Param("stateId") Long stateId,
                                 @org.springframework.data.repository.query.Param("districtId") Long districtId,
                                 @org.springframework.data.repository.query.Param("blockId") Long blockId);
}
