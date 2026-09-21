package com.ramichanstore.backend.modules.users.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.users.dto.ResetPasswordRequest;
import com.ramichanstore.backend.modules.users.dto.UserCreateRequest;
import com.ramichanstore.backend.modules.users.dto.UserResponse;
import com.ramichanstore.backend.modules.users.dto.UserUpdateRequest;
import com.ramichanstore.backend.modules.users.entity.Role;
import com.ramichanstore.backend.modules.users.entity.User;
import com.ramichanstore.backend.modules.users.repository.RoleRepository;
import com.ramichanstore.backend.modules.users.repository.UserRepository;
import com.ramichanstore.backend.security.SecurityUser;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * `username`/`email` no tienen índice único filtrado por soft-delete todavía
 * en V1 (UNIQUE a secas) — evitar reutilizar el username/email de un usuario
 * eliminado hasta que se agregue esa migración (ver lección de Fase 1/3).
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private static final String MODULE = "USERS";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse findResponseById(Long id) {
        return UserResponse.from(findById(id));
    }

    @Transactional(readOnly = true)
    public User findById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Usuario", id));
    }

    @Transactional
    public UserResponse create(UserCreateRequest request) {
        validateUniqueUsername(request.username(), null);
        validateUniqueEmail(request.email(), null);

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setFullName(request.fullName());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(resolveRole(request.roleId()));
        user.setActive(request.active());
        User saved = userRepository.save(user);

        auditService.log(AuditAction.CREATE, MODULE, "User", saved.getId().toString(), null, summarize(saved));
        return UserResponse.from(saved);
    }

    @Transactional
    public UserResponse update(Long id, UserUpdateRequest request, SecurityUser currentUser) {
        User user = findById(id);
        validateUniqueUsername(request.username(), id);
        validateUniqueEmail(request.email(), id);
        if (id.equals(currentUser.getId()) && !request.active()) {
            throw new BusinessRuleException("No puedes desactivar tu propia cuenta");
        }

        String before = summarize(user);
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setFullName(request.fullName());
        user.setRole(resolveRole(request.roleId()));
        user.setActive(request.active());
        User saved = userRepository.save(user);

        auditService.log(AuditAction.UPDATE, MODULE, "User", id.toString(), before, summarize(saved));
        return UserResponse.from(saved);
    }

    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request) {
        User user = findById(id);
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        auditService.log(AuditAction.UPDATE, MODULE, "User.password", id.toString(), null, "Contraseña restablecida por admin");
    }

    @Transactional
    public void delete(Long id, SecurityUser currentUser) {
        if (id.equals(currentUser.getId())) {
            throw new BusinessRuleException("No puedes eliminar tu propia cuenta");
        }
        User user = findById(id);
        user.softDelete();
        userRepository.save(user);
        auditService.log(AuditAction.DELETE, MODULE, "User", id.toString(), summarize(user), null);
    }

    private void validateUniqueUsername(String username, Long excludingId) {
        userRepository.findByUsernameOrEmail(username, "\0").ifPresent(existing -> {
            if (!existing.getId().equals(excludingId)) {
                throw new BusinessRuleException("Ya existe un usuario con el username '" + username + "'");
            }
        });
    }

    private void validateUniqueEmail(String email, Long excludingId) {
        userRepository.findByUsernameOrEmail("\0", email).ifPresent(existing -> {
            if (!existing.getId().equals(excludingId)) {
                throw new BusinessRuleException("Ya existe un usuario con el correo '" + email + "'");
            }
        });
    }

    private Role resolveRole(Long roleId) {
        return roleRepository.findById(roleId).orElseThrow(() -> ResourceNotFoundException.of("Rol", roleId));
    }

    private String summarize(User user) {
        return "username=%s, email=%s, rol=%s, activo=%s"
                .formatted(user.getUsername(), user.getEmail(), user.getRole().getName(), user.isActive());
    }
}
