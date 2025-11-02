package com.ai.codereviewer.repository;

import com.ai.codereviewer.model.Bug;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BugRepository extends JpaRepository<Bug, Long> {
}
