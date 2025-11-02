package com.ai.codereviewer.controller;

import com.ai.codereviewer.model.Bug;
import com.ai.codereviewer.repository.BugRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/bugs")
public class BugController {

    private final BugRepository bugRepo;

    public BugController(BugRepository bugRepo) {
        this.bugRepo = bugRepo;
    }

    @GetMapping
    public List<Bug> getAll() {
        return bugRepo.findAll();
    }

    @PostMapping
    public Bug create(@RequestBody Bug bug) {
        return bugRepo.save(bug);
    }

    @PutMapping("/{id}")
    public Bug update(@PathVariable Long id, @RequestBody Bug updated) {
        Bug bug = bugRepo.findById(id).orElseThrow();
        bug.setStatus(updated.getStatus());
        return bugRepo.save(bug);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        bugRepo.deleteById(id);
    }
}
