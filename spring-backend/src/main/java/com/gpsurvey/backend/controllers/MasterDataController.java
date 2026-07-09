package com.gpsurvey.backend.controllers;

import com.gpsurvey.backend.repositories.*;
import com.gpsurvey.backend.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/master")
@CrossOrigin(origins = "*")
public class MasterDataController {

    @Autowired private StateRepository stateRepo;
    @Autowired private DistrictRepository districtRepo;
    @Autowired private BlockRepository blockRepo;
    @Autowired private GramPanchayatRepository gpRepo;

    // Lightweight - states + districts only (small data, one call)
    @GetMapping("/lite")
    public ResponseEntity<?> getLiteData(
            @RequestParam(defaultValue = "0") long afterStateId,
            @RequestParam(defaultValue = "0") long afterDistrictId) {
        Map<String, Object> data = new HashMap<>();
        data.put("states", stateRepo.findByIdGreaterThan(afterStateId));
        data.put("districts", districtRepo.findByIdGreaterThan(afterDistrictId));
        data.put("totalBlocks", blockRepo.count());
        data.put("totalGPs", gpRepo.count());
        data.put("maxBlockId", blockRepo.findMaxId());
        data.put("maxGpId", gpRepo.findMaxId());
        return ResponseEntity.ok(data);
    }

    // Parallel chunked blocks — range-based
    @GetMapping("/blocks")
    public ResponseEntity<?> getBlocks(
            @RequestParam(defaultValue = "0") long startId,
            @RequestParam(defaultValue = "9999999999") long endId) {
        var content = blockRepo.findByIdGreaterThanAndIdLessThanEqualOrderByIdAsc(startId, endId);
        Map<String, Object> data = new HashMap<>();
        data.put("content", content);
        return ResponseEntity.ok(data);
    }

    // Parallel chunked GPs — range-based
    @GetMapping("/gps")
    public ResponseEntity<?> getGPs(
            @RequestParam(defaultValue = "0") long startId,
            @RequestParam(defaultValue = "9999999999") long endId) {
        var content = gpRepo.findByIdGreaterThanAndIdLessThanEqualOrderByIdAsc(startId, endId);
        Map<String, Object> data = new HashMap<>();
        data.put("content", content);
        return ResponseEntity.ok(data);
    }

    // Keep old endpoint for backward compatibility
    @GetMapping("/all")
    public ResponseEntity<?> getAllMasterData() {
        Map<String, Object> data = new HashMap<>();
        data.put("states", stateRepo.findAll());
        data.put("districts", districtRepo.findAll());
        data.put("blocks", blockRepo.findAll());
        data.put("gramPanchayats", gpRepo.findAll());
        return ResponseEntity.ok(data);
    }

    // Individual add endpoints
    @PostMapping("/states")
    public ResponseEntity<?> addState(@RequestBody Map<String, String> body) {
        State s = new State();
        s.setName(body.get("name"));
        return ResponseEntity.ok(stateRepo.save(s));
    }

    @PostMapping("/districts")
    public ResponseEntity<?> addDistrict(@RequestBody Map<String, Object> body) {
        District d = new District();
        d.setName((String) body.get("name"));
        State state = new State();
        state.setId(Long.valueOf(body.get("stateId").toString()));
        d.setState(state);
        return ResponseEntity.ok(districtRepo.save(d));
    }

    @PostMapping("/blocks")
    public ResponseEntity<?> addBlock(@RequestBody Map<String, Object> body) {
        Block b = new Block();
        b.setName((String) body.get("name"));
        District district = new District();
        district.setId(Long.valueOf(body.get("districtId").toString()));
        b.setDistrict(district);
        return ResponseEntity.ok(blockRepo.save(b));
    }

    @PostMapping("/grampanchayats")
    public ResponseEntity<?> addGP(@RequestBody Map<String, Object> body) {
        GramPanchayat gp = new GramPanchayat();
        gp.setName((String) body.get("name"));
        gp.setCode((String) body.get("code"));
        Block block = new Block();
        block.setId(Long.valueOf(body.get("blockId").toString()));
        gp.setBlock(block);
        return ResponseEntity.ok(gpRepo.save(gp));
    }
}
