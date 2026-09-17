package com.ramichanstore.backend.modules.users.repository;

import com.ramichanstore.backend.modules.users.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
}
