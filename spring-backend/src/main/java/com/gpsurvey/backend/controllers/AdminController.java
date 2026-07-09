package com.gpsurvey.backend.controllers;
import com.gpsurvey.backend.dto.WorkerInviteRequest;
import com.gpsurvey.backend.models.Survey;
import com.gpsurvey.backend.models.User;
import com.gpsurvey.backend.repositories.SurveyRepository;
import com.gpsurvey.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired private SurveyRepository surveyRepo;
    @Autowired private UserRepository userRepo;

    private User getAuthenticatedUser(String authHeader) {
        Long userId = Long.parseLong(authHeader.replace("Bearer dummy-jwt-token-", ""));
        return userRepo.findById(userId).orElseThrow();
    }

    @PostMapping("/invite-worker")
    public ResponseEntity<?> inviteWorker(@RequestBody WorkerInviteRequest request, @RequestHeader("Authorization") String authHeader) {
        try {
            User admin = getAuthenticatedUser(authHeader);
            if (!"COMPANY_ADMIN".equals(admin.getRole())) {
                return ResponseEntity.status(403).body("Only Company Admin can invite workers");
            }
            
            if(userRepo.findByUsername(request.getUsername()).isPresent()) {
                return ResponseEntity.badRequest().body("Username already exists");
            }
            
            User worker = new User();
            worker.setUsername(request.getUsername());
            worker.setPassword(request.getPassword()); // In real app: hash password
            worker.setName(request.getName());
            worker.setContactNo(request.getContactNo());
            worker.setRole("SURVEYOR");
            worker.setCompany(admin.getCompany());
            userRepo.save(worker);
            
            return ResponseEntity.ok("Worker invited successfully");
        } catch(Exception e) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
    }

    @GetMapping("/surveys")
    public ResponseEntity<?> getCompanySurveys(
            @RequestParam(defaultValue = "0") long afterId,
            @RequestParam(defaultValue = "500") int size,
            @RequestHeader("Authorization") String authHeader) {
        try {
            User user = getAuthenticatedUser(authHeader);
            
            if (!"COMPANY_ADMIN".equals(user.getRole()) && !"SUPER_ADMIN".equals(user.getRole())) {
                return ResponseEntity.status(403).body("Access denied");
            }
            
            org.springframework.data.domain.Page<Survey> result;
            long totalElements;
            if ("SUPER_ADMIN".equals(user.getRole())) {
                result = surveyRepo.findByIdGreaterThanOrderByIdAsc(afterId, org.springframework.data.domain.PageRequest.of(0, size));
                totalElements = surveyRepo.countByIdGreaterThan(afterId);
            } else {
                result = surveyRepo.findByCompanyIdAndIdGreaterThanOrderByIdAsc(user.getCompany().getId(), afterId, org.springframework.data.domain.PageRequest.of(0, size));
                totalElements = surveyRepo.countByCompanyIdAndIdGreaterThan(user.getCompany().getId(), afterId);
            }
            
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("content", result.getContent());
            data.put("hasMore", result.hasNext());
            data.put("lastId", result.getContent().isEmpty() ? afterId :
                    result.getContent().get(result.getContent().size() - 1).getId());
            data.put("totalElements", totalElements);
            
            return ResponseEntity.ok(data);
        } catch(Exception e) {
            return ResponseEntity.status(401).body("Unauthorized: " + e.getMessage());
        }
    }
}
