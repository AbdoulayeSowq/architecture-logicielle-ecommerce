package com.lms.user.repository;

import com.lms.user.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;


public interface AddressRepository extends JpaRepository<Address, Long> {
    Address findById(long id);
}
