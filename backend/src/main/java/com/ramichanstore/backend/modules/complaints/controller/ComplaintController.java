package com.ramichanstore.backend.modules.complaints.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.common.dto.PageResponse;
import com.ramichanstore.backend.modules.complaints.dto.ComplaintResponse;
import com.ramichanstore.backend.modules.complaints.dto.ComplaintSubmission;
import com.ramichanstore.backend.modules.complaints.dto.RespondComplaintRequest;
import com.ramichanstore.backend.modules.complaints.entity.ComplaintStatus;
import com.ramichanstore.backend.modules.complaints.entity.ComplaintType;
import com.ramichanstore.backend.modules.complaints.service.ComplaintService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * `POST /api/complaints` es pública a propósito (ver SecurityConfig,
 * permitAll solo para este método+ruta) — el Libro de Reclamaciones es
 * obligatorio por ley y debe poder llenarlo cualquier visitante, sin cuenta.
 * El resto exige sesión de staff con los permisos PERM_COMPLAINT_*.
 */
@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    public ApiResponse<ComplaintResponse> submit(@Valid @RequestBody ComplaintSubmission request) {
        return ApiResponse.ok("Reclamo registrado", complaintService.submit(request));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_COMPLAINT_VIEW')")
    public ApiResponse<PageResponse<ComplaintResponse>> search(
            @RequestParam(required = false) ComplaintType type,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(PageResponse.from(complaintService.search(type, status, from, to, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_COMPLAINT_VIEW')")
    public ApiResponse<ComplaintResponse> findById(@PathVariable Long id) {
        return ApiResponse.ok(complaintService.findResponseById(id));
    }

    @PostMapping("/{id}/respond")
    @PreAuthorize("hasAuthority('PERM_COMPLAINT_MANAGE')")
    public ApiResponse<ComplaintResponse> respond(@PathVariable Long id, @Valid @RequestBody RespondComplaintRequest request) {
        return ApiResponse.ok("Respuesta registrada", complaintService.respond(id, request));
    }
}
