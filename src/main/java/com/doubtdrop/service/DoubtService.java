package com.doubtdrop.service;

import com.doubtdrop.dto.CreateDoubtRequest;
import com.doubtdrop.model.Doubt;
import com.doubtdrop.model.DoubtStatus;
import com.doubtdrop.repository.DoubtRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.*;

@Service
public class DoubtService {
    private final DoubtRepository repo;
    private final SecureRandom random = new SecureRandom();

    public DoubtService(DoubtRepository repo) {
        this.repo = repo;
    }

    public List<Doubt> list(String subject, String status, String query, String sort) {
        List<Doubt> list = (subject != null && !subject.isBlank() && !subject.equalsIgnoreCase("all"))
                ? repo.findBySubjectIgnoreCaseOrderByCreatedAtDesc(subject.trim())
                : repo.findAllByOrderByCreatedAtDesc();

        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("all")) {
            try {
                DoubtStatus s = DoubtStatus.valueOf(status.toUpperCase(Locale.ROOT));
                list = list.stream().filter(d -> d.getStatus() == s).toList();
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
            }
        }

        if ("trending".equalsIgnoreCase(sort)) {
            list = list.stream().sorted((a, b) -> Integer.compare(b.getVotes(), a.getVotes())).toList();
        }

        if (query != null && !query.isBlank()) {
            String q = query.toLowerCase(Locale.ROOT);
            list = list.stream().filter(d ->
                    d.getTitle().toLowerCase(Locale.ROOT).contains(q)
                            || safe(d.getDetails()).toLowerCase(Locale.ROOT).contains(q)
                            || d.getSubject().toLowerCase(Locale.ROOT).contains(q)
                            || safe(d.getTopic()).toLowerCase(Locale.ROOT).contains(q)
                            || d.getTrackingCode().toLowerCase(Locale.ROOT).contains(q)
            ).toList();
        }

        return list;
    }

    public Doubt create(CreateDoubtRequest r) {
        String code;
        do {
            code = "DD-" + (100000 + random.nextInt(900000));
        } while (repo.findByTrackingCodeIgnoreCase(code).isPresent());

        return repo.save(new Doubt(code, r.subject().trim(), r.title().trim(), clean(r.details()), clean(r.topic())));
    }

    public Doubt findByCode(String code) {
        return repo.findByTrackingCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doubt not found with tracking code: " + code));
    }

    public Doubt findById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doubt not found with ID: " + id));
    }

    public Doubt vote(Long id) {
        Doubt d = findById(id);
        d.incrementVotes();
        return repo.save(d);
    }

    public Doubt answer(Long id, String answer) {
        Doubt d = findById(id);
        d.setAnswer(answer.trim());
        return repo.save(d);
    }

    public Doubt setStatus(Long id, DoubtStatus status) {
        Doubt d = findById(id);
        d.setStatus(status);
        return repo.save(d);
    }

    public void delete(Long id) {
        Doubt d = findById(id);
        repo.delete(d);
    }

    public Map<String, Object> getStats() {
        List<Doubt> all = repo.findAll();
        long total = all.size();
        long answered = all.stream().filter(d -> d.getStatus() == DoubtStatus.ANSWERED).count();
        long resolved = all.stream().filter(d -> d.getStatus() == DoubtStatus.RESOLVED).count();
        long pending = all.stream().filter(d -> d.getStatus() == DoubtStatus.PENDING).count();
        long totalVotes = all.stream().mapToInt(Doubt::getVotes).sum();

        Map<String, Long> subjectCounts = new LinkedHashMap<>();
        for (Doubt d : all) {
            subjectCounts.put(d.getSubject(), subjectCounts.getOrDefault(d.getSubject(), 0L) + 1L);
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", total);
        stats.put("answered", answered);
        stats.put("resolved", resolved);
        stats.put("pending", pending);
        stats.put("totalVotes", totalVotes);
        stats.put("subjectCounts", subjectCounts);
        return stats;
    }

    public void save(Doubt doubt) {
        repo.save(doubt);
    }

    public long count() {
        return repo.count();
    }

    private String clean(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }
}
