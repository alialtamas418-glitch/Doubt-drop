package com.doubtdrop.repository;
import com.doubtdrop.model.Doubt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface DoubtRepository extends JpaRepository<Doubt,Long> {
 Optional<Doubt> findByTrackingCodeIgnoreCase(String code);
 List<Doubt> findAllByOrderByCreatedAtDesc();
 List<Doubt> findBySubjectIgnoreCaseOrderByCreatedAtDesc(String subject);
}
