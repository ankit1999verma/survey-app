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
        try {
            Long userId = Long.parseLong(authHeader.replace("Bearer dummy-jwt-token-", ""));
            User user = userRepo.findById(userId).orElseThrow();
            
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            
            for(Survey s : request.getSurveys()) {
                java.util.Optional<Survey> existing = surveyRepo.findByUuid(s.getUuid());
                if(existing.isPresent()) {
                    s.setId(existing.get().getId());
                    s.setCreatedAt(existing.get().getCreatedAt());
                } else {
                    s.setId(null); // Create new record
                }
                s.setUser(user);
                s.setCompany(user.getCompany());
                
                // If it contains photos, upload them to UPM API
                if (s.getPhotoBase64() != null && !s.getPhotoBase64().isEmpty()) {
                    try {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        com.fasterxml.jackson.databind.JsonNode photosNode = mapper.readTree(s.getPhotoBase64());
                        if (photosNode.isArray()) {
                            java.util.List<String> uploadedUrls = new java.util.ArrayList<>();
                            for (com.fasterxml.jackson.databind.JsonNode node : photosNode) {
                                String b64 = node.asText();
                                if (b64.startsWith("http")) {
                                    uploadedUrls.add(b64);
                                } else {
                                    org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                                    headers.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);
                                    
                                    org.springframework.util.MultiValueMap<String, String> map= new org.springframework.util.LinkedMultiValueMap<>();
                                    map.add("base64File", b64);
                                    
                                    org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, String>> req = new org.springframework.http.HttpEntity<>(map, headers);
                                    
                                    ResponseEntity<String> res = restTemplate.postForEntity("https://upm.tivarax.in/api/upm/file/upload/base64", req, String.class);
                                    if(res.getStatusCode().is2xxSuccessful()) {
                                        uploadedUrls.add(res.getBody());
                                    } else {
                                        uploadedUrls.add(b64); // Fallback
                                    }
                                }
                            }
                            s.setPhotoBase64(mapper.writeValueAsString(uploadedUrls));
                        }
                    } catch (Exception e) {
                        System.err.println("Error uploading photo: " + e.getMessage());
                    }
                }
                
                surveyRepo.save(s);
            }
            return ResponseEntity.ok("Synced successfully");
        } catch(Exception e) {
            e.printStackTrace();
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
