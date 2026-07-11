package com.gpsurvey.backend.controllers;

import com.gpsurvey.backend.models.Survey;
import com.gpsurvey.backend.models.User;
import com.gpsurvey.backend.repositories.SurveyRepository;
import com.gpsurvey.backend.repositories.UserRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/export")
@CrossOrigin(origins = "*")
public class ExportController {

    @Autowired
    private SurveyRepository surveyRepo;

    @Autowired
    private UserRepository userRepo;

    @GetMapping("/excel")
    public ResponseEntity<?> exportExcel(
            @RequestParam(required = false) Long stateId,
            @RequestParam(required = false) Long districtId,
            @RequestParam(required = false) Long blockId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = Long.parseLong(authHeader.replace("Bearer dummy-jwt-token-", ""));
            User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

            // Check subscription
            if (user.getSubscriptionExpiryDate() == null || user.getSubscriptionExpiryDate().isBefore(LocalDateTime.now())) {
                return ResponseEntity.status(403).body("Subscription expired. Please renew your subscription to export data.");
            }

            // Fetch surveys
            List<Survey> surveys = surveyRepo.findSurveysWithFilters(userId, stateId, districtId, blockId);

            // Generate Excel
            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("Surveys");

            // Header Row
            Row headerRow = sheet.createRow(0);
            String[] columns = {
                    "UUID", "State", "District", "Block", "Gram Panchayat", "GP Code",
                    "Phase", "Survey Vendor", "Survey Date", "Survey Done", "Remarks",
                    "Original Location Type", "Orig Infra Status", "Orig Electricity", "Orig Power Hours", "Orig Solar", "Orig Earthing",
                    "Orig Lat", "Orig Long",
                    "Current Location", "Current Perm/Temp", "Current Lat", "Current Long",
                    "GP Bhawan Available", "GP Bhawan Infra", "GP Bhawan Energy", "GP Bhawan Earthing", "GP Bhawan Solar",
                    "GP Bhawan Lat", "GP Bhawan Long",
                    "Proposed Building", "Proposed Rack Space", "Proposed Lat", "Proposed Long",
                    "Proposed Energy Meter", "Proposed Earthing", "Proposed Solar", "Proposed Pole Length",
                    "Proposed Pole Lat", "Proposed Pole Long", "Proposed Remarks",
                    "Sarpanch Name", "Sarpanch Contact"
            };

            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
            }

            // Data Rows
            int rowNum = 1;
            for (Survey s : surveys) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(s.getUuid() != null ? s.getUuid() : "");
                row.createCell(1).setCellValue(s.getStateName() != null ? s.getStateName() : "");
                row.createCell(2).setCellValue(s.getDistrictName() != null ? s.getDistrictName() : "");
                row.createCell(3).setCellValue(s.getBlockName() != null ? s.getBlockName() : "");
                row.createCell(4).setCellValue(s.getGramPanchayatName() != null ? s.getGramPanchayatName() : "");
                row.createCell(5).setCellValue(s.getGramPanchayatCode() != null ? s.getGramPanchayatCode() : "");
                row.createCell(6).setCellValue(s.getPhase() != null ? s.getPhase() : "");
                row.createCell(7).setCellValue(s.getSurveyVendor() != null ? s.getSurveyVendor() : "");
                row.createCell(8).setCellValue(s.getSurveyDate() != null ? s.getSurveyDate() : "");
                row.createCell(9).setCellValue(s.getSurveyDone() != null ? s.getSurveyDone() : "");
                row.createCell(10).setCellValue(s.getRemarks() != null ? s.getRemarks() : "");
                row.createCell(11).setCellValue(s.getOrigLocationType() != null ? s.getOrigLocationType() : "");
                row.createCell(12).setCellValue(s.getOrigInfraStatus() != null ? s.getOrigInfraStatus() : "");
                row.createCell(13).setCellValue(s.getOrigElectricity() != null ? s.getOrigElectricity() : "");
                row.createCell(14).setCellValue(s.getOrigPowerHours() != null ? s.getOrigPowerHours() : "");
                row.createCell(15).setCellValue(s.getOrigSolar() != null ? s.getOrigSolar() : "");
                row.createCell(16).setCellValue(s.getOrigEarthing() != null ? s.getOrigEarthing() : "");
                row.createCell(17).setCellValue(s.getOrigLat() != null ? String.valueOf(s.getOrigLat()) : "");
                row.createCell(18).setCellValue(s.getOrigLong() != null ? String.valueOf(s.getOrigLong()) : "");
                row.createCell(19).setCellValue(s.getCurrentLocation() != null ? s.getCurrentLocation() : "");
                row.createCell(20).setCellValue(s.getCurrentPermTemp() != null ? s.getCurrentPermTemp() : "");
                row.createCell(21).setCellValue(s.getCurrentLat() != null ? String.valueOf(s.getCurrentLat()) : "");
                row.createCell(22).setCellValue(s.getCurrentLong() != null ? String.valueOf(s.getCurrentLong()) : "");
                row.createCell(23).setCellValue(s.getGpBhawanAvailable() != null ? s.getGpBhawanAvailable() : "");
                row.createCell(24).setCellValue(s.getGpBhawanInfraStatus() != null ? s.getGpBhawanInfraStatus() : "");
                row.createCell(25).setCellValue(s.getGpBhawanEnergyMeter() != null ? s.getGpBhawanEnergyMeter() : "");
                row.createCell(26).setCellValue(s.getGpBhawanEarthing() != null ? s.getGpBhawanEarthing() : "");
                row.createCell(27).setCellValue(s.getGpBhawanSolar() != null ? s.getGpBhawanSolar() : "");
                row.createCell(28).setCellValue(s.getGpBhawanLat() != null ? String.valueOf(s.getGpBhawanLat()) : "");
                row.createCell(29).setCellValue(s.getGpBhawanLong() != null ? String.valueOf(s.getGpBhawanLong()) : "");
                row.createCell(30).setCellValue(s.getProposedBuilding() != null ? s.getProposedBuilding() : "");
                row.createCell(31).setCellValue(s.getProposedRackSpace() != null ? s.getProposedRackSpace() : "");
                row.createCell(32).setCellValue(s.getProposedLat() != null ? String.valueOf(s.getProposedLat()) : "");
                row.createCell(33).setCellValue(s.getProposedLong() != null ? String.valueOf(s.getProposedLong()) : "");
                row.createCell(34).setCellValue(s.getProposedEnergyMeter() != null ? s.getProposedEnergyMeter() : "");
                row.createCell(35).setCellValue(s.getProposedEarthing() != null ? s.getProposedEarthing() : "");
                row.createCell(36).setCellValue(s.getProposedSolar() != null ? s.getProposedSolar() : "");
                row.createCell(37).setCellValue(s.getProposedPoleLength() != null ? s.getProposedPoleLength() : "");
                row.createCell(38).setCellValue(s.getProposedPoleLat() != null ? String.valueOf(s.getProposedPoleLat()) : "");
                row.createCell(39).setCellValue(s.getProposedPoleLong() != null ? String.valueOf(s.getProposedPoleLong()) : "");
                row.createCell(40).setCellValue(s.getProposedRemarks() != null ? s.getProposedRemarks() : "");
                row.createCell(41).setCellValue(s.getSarpanchName() != null ? s.getSarpanchName() : "");
                row.createCell(42).setCellValue(s.getSarpanchContact() != null ? s.getSarpanchContact() : "");
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            workbook.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "surveys_export.xlsx");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(outputStream.toByteArray());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Export failed: " + e.getMessage());
        }
    }
}
