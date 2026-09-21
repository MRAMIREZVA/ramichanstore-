package com.ramichanstore.backend.modules.users.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.users.dto.PermissionResponse;
import com.ramichanstore.backend.modules.users.dto.RoleRequest;
import com.ramichanstore.backend.modules.users.dto.RoleResponse;
import com.ramichanstore.backend.modules.users.entity.Permission;
import com.ramichanstore.backend.modules.users.entity.Role;
import com.ramichanstore.backend.modules.users.repository.PermissionRepository;
import com.ramichanstore.backend.modules.users.repository.RoleRepository;
import com.ramichanstore.backend.modules.users.repository.UserRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** El rol "ADMIN" (semilla de Fase 0) no se puede renombrar ni eliminar: es el único con acceso garantizado a todo el sistema. */
@Service
@RequiredArgsConstructor
public class RoleService {

    private static final String MODULE = "USERS";
    private static final String PROTECTED_ROLE = "ADMIN";

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<RoleResponse> findAll() {
        return roleRepository.findAll().stream().map(RoleResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> findAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(PermissionResponse::from)
                .sorted((a, b) -> a.module().equals(b.module()) ? a.code().compareTo(b.code()) : a.module().compareTo(b.module()))
                .toList();
    }

    @Transactional
    public RoleResponse create(RoleRequest request) {
        roleRepository.findByName(request.name()).ifPresent(r -> {
            throw new BusinessRuleException("Ya existe un rol con el nombre '" + request.name() + "'");
        });

        Role role = new Role();
        role.setName(request.name());
        role.setDescription(request.description());
        role.setPermissions(resolvePermissions(request.permissionIds()));
        Role saved = roleRepository.save(role);

        auditService.log(AuditAction.CREATE, MODULE, "Role", saved.getId().toString(), null, summarize(saved));
        return RoleResponse.from(saved);
    }

    @Transactional
    public RoleResponse update(Long id, RoleRequest request) {
        Role role = findById(id);
        if (PROTECTED_ROLE.equalsIgnoreCase(role.getName()) && !PROTECTED_ROLE.equalsIgnoreCase(request.name())) {
            throw new BusinessRuleException("El rol ADMIN no se puede renombrar");
        }
        if (!role.getName().equalsIgnoreCase(request.name())) {
            roleRepository.findByName(request.name()).ifPresent(r -> {
                throw new BusinessRuleException("Ya existe un rol con el nombre '" + request.name() + "'");
            });
        }

        String before = summarize(role);
        role.setName(request.name());
        role.setDescription(request.description());
        role.setPermissions(resolvePermissions(request.permissionIds()));
        Role saved = roleRepository.save(role);

        auditService.log(AuditAction.UPDATE, MODULE, "Role", id.toString(), before, summarize(saved));
        return RoleResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        Role role = findById(id);
        if (PROTECTED_ROLE.equalsIgnoreCase(role.getName())) {
            throw new BusinessRuleException("El rol ADMIN no se puede eliminar");
        }
        if (userRepository.existsByRoleId(id)) {
            throw new BusinessRuleException("No se puede eliminar un rol con usuarios asignados");
        }
        role.softDelete();
        roleRepository.save(role);
        auditService.log(AuditAction.DELETE, MODULE, "Role", id.toString(), summarize(role), null);
    }

    private Role findById(Long id) {
        return roleRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Rol", id));
    }

    private Set<Permission> resolvePermissions(Set<Long> ids) {
        if (ids.isEmpty()) {
            return new HashSet<>();
        }
        List<Permission> found = permissionRepository.findAllById(ids);
        if (found.size() != ids.size()) {
            throw new BusinessRuleException("Uno o más permisos seleccionados no existen");
        }
        return new HashSet<>(found);
    }

    private String summarize(Role role) {
        return "nombre=%s, permisos=%d".formatted(role.getName(), role.getPermissions().size());
    }
}
