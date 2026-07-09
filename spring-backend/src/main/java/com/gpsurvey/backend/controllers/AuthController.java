package com.gpsurvey.backend.controllers;
import com.gpsurvey.backend.dto.*;
import com.gpsurvey.backend.models.Company;
import com.gpsurvey.backend.models.User;
import com.gpsurvey.backend.repositories.CompanyRepository;
import com.gpsurvey.backend.repositories.UserRepository;
import com.gpsurvey.backend.services.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired private UserRepository userRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private EmailService emailService;
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsernameOrContactNo(request.getUsername(), request.getUsername());
        if(userOpt.isPresent() && userOpt.get().getPassword().equals(request.getPassword())) {
            User user = userOpt.get();
            if (user.getCompany() != null && "INACTIVE".equalsIgnoreCase(user.getCompany().getSubscriptionStatus())) {
                return ResponseEntity.status(403).body("Subscription inactive. Please contact marketing.");
            }
            String token = "dummy-jwt-token-" + user.getId();
            Long companyId = user.getCompany() != null ? user.getCompany().getId() : null;
            return ResponseEntity.ok(new LoginResponse(token, user.getUsername(), user.getRole(), companyId));
        }
        return ResponseEntity.status(401).body("Invalid credentials");
    }

    @PostMapping("/register-company")
    public ResponseEntity<?> registerCompany(@RequestBody CompanyRegistrationRequest request) {
        if(userRepository.findByUsername(request.getAdminUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        
        Company company = new Company();
        company.setName(request.getCompanyName());
        company = companyRepository.save(company);
        
        User admin = new User();
        admin.setUsername(request.getAdminUsername());
        admin.setPassword(request.getAdminPassword()); // In real app: hash password
        admin.setName(request.getAdminName());
        admin.setContactNo(request.getAdminContactNo());
        admin.setRole("COMPANY_ADMIN");
        admin.setCompany(company);
        userRepository.save(admin);
        
        emailService.sendRegistrationEmail(request.getAdminUsername(), request.getAdminUsername(), request.getAdminPassword());
        
        return ResponseEntity.ok("Company and Admin created successfully");
    }
}
