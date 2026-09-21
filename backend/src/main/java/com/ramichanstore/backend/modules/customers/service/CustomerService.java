package com.ramichanstore.backend.modules.customers.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BusinessRuleException;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.customers.dto.CustomerRequest;
import com.ramichanstore.backend.modules.customers.dto.CustomerResponse;
import com.ramichanstore.backend.modules.customers.dto.EnablePortalAccessRequest;
import com.ramichanstore.backend.modules.customers.dto.ResetPortalPasswordRequest;
import com.ramichanstore.backend.modules.customers.entity.Customer;
import com.ramichanstore.backend.modules.customers.entity.CustomerStatus;
import com.ramichanstore.backend.modules.customers.repository.CustomerRepository;
import com.ramichanstore.backend.modules.customers.repository.CustomerSpecifications;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private static final String MODULE = "CUSTOMERS";

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<CustomerResponse> search(String term, CustomerStatus status, Pageable pageable) {
        List<Specification<Customer>> specs = Stream.of(
                        CustomerSpecifications.search(term),
                        CustomerSpecifications.hasStatus(status))
                .filter(Objects::nonNull)
                .toList();
        Specification<Customer> spec = specs.isEmpty() ? null : Specification.allOf(specs);
        return customerRepository.findAll(spec, pageable).map(CustomerResponse::from);
    }

    @Transactional(readOnly = true)
    public CustomerResponse findResponseById(Long id) {
        return CustomerResponse.from(findById(id));
    }

    @Transactional(readOnly = true)
    public Customer findById(Long id) {
        return customerRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Cliente", id));
    }

    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        validateDocumentNumber(request.documentNumber(), null);
        Customer customer = new Customer();
        applyRequest(customer, request);
        Customer saved = customerRepository.save(customer);
        auditService.log(AuditAction.CREATE, MODULE, "Customer", saved.getId().toString(), null, summarize(saved));
        return CustomerResponse.from(saved);
    }

    @Transactional
    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = findById(id);
        validateDocumentNumber(request.documentNumber(), customer.getDocumentNumber());
        String before = summarize(customer);
        applyRequest(customer, request);
        Customer saved = customerRepository.save(customer);
        auditService.log(AuditAction.UPDATE, MODULE, "Customer", id.toString(), before, summarize(saved));
        return CustomerResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        Customer customer = findById(id);
        customer.softDelete();
        customerRepository.save(customer);
        auditService.log(AuditAction.DELETE, MODULE, "Customer", id.toString(), summarize(customer), null);
    }

    /** Habilita (o re-habilita con credenciales nuevas) el acceso de un cliente al portal de solo lectura. */
    @Transactional
    public CustomerResponse enablePortalAccess(Long id, EnablePortalAccessRequest request) {
        Customer customer = findById(id);
        boolean usernameTaken = customerRepository.findByPortalUsernameIgnoreCase(request.username())
                .filter(existing -> !existing.getId().equals(id))
                .isPresent();
        if (usernameTaken) {
            throw new BusinessRuleException("Ya existe un cliente con el usuario de portal '" + request.username() + "'");
        }

        customer.setPortalUsername(request.username());
        customer.setPortalPasswordHash(passwordEncoder.encode(request.password()));
        customer.setPortalEnabled(true);
        Customer saved = customerRepository.save(customer);

        auditService.log(AuditAction.UPDATE, MODULE, "Customer.portalAccess", id.toString(), "disabled", "enabled:" + request.username());
        return CustomerResponse.from(saved);
    }

    @Transactional
    public void resetPortalPassword(Long id, ResetPortalPasswordRequest request) {
        Customer customer = findById(id);
        if (!customer.isPortalEnabled()) {
            throw new BusinessRuleException("Este cliente no tiene acceso al portal habilitado");
        }
        customer.setPortalPasswordHash(passwordEncoder.encode(request.newPassword()));
        customerRepository.save(customer);
        auditService.log(AuditAction.UPDATE, MODULE, "Customer.portalAccess", id.toString(), null, "Contraseña de portal restablecida por admin");
    }

    @Transactional
    public CustomerResponse disablePortalAccess(Long id) {
        Customer customer = findById(id);
        customer.setPortalEnabled(false);
        Customer saved = customerRepository.save(customer);
        auditService.log(AuditAction.UPDATE, MODULE, "Customer.portalAccess", id.toString(), "enabled", "disabled");
        return CustomerResponse.from(saved);
    }

    private void validateDocumentNumber(String documentNumber, String currentDocumentNumber) {
        if (!StringUtils.hasText(documentNumber)) {
            return;
        }
        boolean unchanged = documentNumber.equalsIgnoreCase(currentDocumentNumber);
        if (!unchanged && customerRepository.existsByDocumentNumberIgnoreCase(documentNumber)) {
            throw new BusinessRuleException("Ya existe un cliente con el documento '" + documentNumber + "'");
        }
    }

    private void applyRequest(Customer customer, CustomerRequest request) {
        customer.setFullName(request.fullName());
        customer.setDocumentType(request.documentType());
        customer.setDocumentNumber(request.documentNumber());
        customer.setPhone(request.phone());
        customer.setWhatsapp(request.whatsapp());
        customer.setEmail(request.email());
        customer.setDistrict(request.district());
        customer.setAddress(request.address());
        customer.setStatus(request.status());
        customer.setNotes(request.notes());
    }

    private String summarize(Customer customer) {
        return "nombre=%s, documento=%s, telefono=%s, estado=%s"
                .formatted(customer.getFullName(), customer.getDocumentNumber(), customer.getPhone(), customer.getStatus());
    }
}
