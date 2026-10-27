package com.doubtdrop.controller;

import com.doubtdrop.dto.CreateDoubtRequest;
import com.doubtdrop.model.Doubt;
import com.doubtdrop.service.DoubtService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doubts")
public class DoubtController {

    private final DoubtService service;

    public DoubtController(DoubtService service) {
        this.service = service;
    }

    @GetMapping
    public List<Doubt> list(
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sort) {
        return service.list(subject, status, q, sort);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return service.getStats();
    }

    @PostMapping
    public Doubt create(@Valid @RequestBody CreateDoubtRequest request) {
        return service.create(request);
    }

    @GetMapping("/{code}")
    public Doubt track(@PathVariable String code) {
        return service.findByCode(code);
    }

    @PostMapping("/{id}/vote")
    public Doubt vote(@PathVariable Long id) {
        return service.vote(id);
    }
}
