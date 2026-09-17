package com.ramichanstore.backend.modules.users.repository;

import com.ramichanstore.backend.modules.users.entity.Role;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
}
