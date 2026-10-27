package com.doubtdrop.controller;

import com.doubtdrop.dto.AnswerRequest;
import com.doubtdrop.model.Doubt;
import com.doubtdrop.model.DoubtStatus;
import com.doubtdrop.service.DoubtService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/doubts")
public class AdminController {

    private final DoubtService service;

    public AdminController(DoubtService service) {
        this.service = service;
    }

    @PostMapping("/{id}/answer")
    public Doubt answer(@PathVariable Long id, @Valid @RequestBody AnswerRequest r) {
        return service.answer(id, r.answer());
    }

    @PatchMapping("/{id}/status")
    public Doubt status(@PathVariable Long id, @RequestParam DoubtStatus value) {
        return service.setStatus(id, value);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
