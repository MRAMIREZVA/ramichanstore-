package com.ramichanstore.backend.modules.settings.repository;

import com.ramichanstore.backend.modules.settings.entity.Setting;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettingRepository extends JpaRepository<Setting, Long> {
    Optional<Setting> findByKey(String key);
    List<Setting> findByCategory(String category);
}
