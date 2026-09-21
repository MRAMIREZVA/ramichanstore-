package com.ramichanstore.backend.modules.customers.repository;

import com.ramichanstore.backend.modules.customers.entity.Customer;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CustomerRepository extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer> {

    boolean existsByDocumentNumberIgnoreCase(String documentNumber);

    List<Customer> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    java.util.Optional<Customer> findByPortalUsernameIgnoreCase(String portalUsername);

    boolean existsByPortalUsernameIgnoreCase(String portalUsername);

    java.util.Optional<Customer> findByPhoneIgnoreCase(String phone);
}
