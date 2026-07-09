package com.gpsurvey.backend.controllers;
import com.gpsurvey.backend.dto.SyncRequest;
import com.gpsurvey.backend.models.Survey;
import com.gpsurvey.backend.models.User;
import com.gpsurvey.backend.repositories.SurveyRepository;
import com.gpsurvey.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/survey")
@CrossOrigin(origins = "*")
public class SurveyController {

    @Autowired private SurveyRepository surveyRepo;
    @Autowired private UserRepository userRepo;

    @PostMapping("/sync")
    public ResponseEntity<?> syncSurveys(@RequestBody SyncRequest request, @RequestHeader("Authorization") String authHeader) {
        // In a real app, extract user from JWT. 
        // For scaffolding, we assume token has user ID: "dummy-jwt-token-1"
        try {
            Long userId = Long.parseLong(authHeader.replace("Bearer dummy-jwt-token-", ""));
            User user = userRepo.findById(userId).orElseThrow();
            
            for(Survey s : request.getSurveys()) {
                s.setUser(user);
                s.setCompany(user.getCompany());
                surveyRepo.save(s);
            }
            return ResponseEntity.ok("Synced successfully");
        } catch(Exception e) {
            return ResponseEntity.badRequest().body("Sync failed: " + e.getMessage());
        }
    }
    @GetMapping("/list")
    public ResponseEntity<?> listSurveys(
            @RequestParam(defaultValue = "0") Long afterId,
            @RequestParam(defaultValue = "1000") int size,
            @RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = Long.parseLong(authHeader.replace("Bearer dummy-jwt-token-", ""));
            
            var result = surveyRepo.findByUserIdAndIdGreaterThanOrderByIdAsc(
                userId, afterId, org.springframework.data.domain.PageRequest.of(0, size));
                
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("content", result.getContent());
            data.put("hasMore", result.hasNext());
            data.put("lastId", result.getContent().isEmpty() ? afterId :
                    result.getContent().get(result.getContent().size() - 1).getId());
            data.put("totalElements", surveyRepo.countByUserIdAndIdGreaterThan(userId, afterId));
            
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to fetch surveys: " + e.getMessage());
        }
    }

    @GetMapping("/count")
    public ResponseEntity<?> countSurveys(
            @RequestParam(required = false) Long stateId,
            @RequestParam(required = false) Long districtId,
            @RequestParam(required = false) Long blockId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = Long.parseLong(authHeader.replace("Bearer dummy-jwt-token-", ""));
            long count = surveyRepo.countSurveysWithFilters(userId, stateId, districtId, blockId);
            
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("total", count);
            
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to fetch survey count: " + e.getMessage());
        }
    }
}
