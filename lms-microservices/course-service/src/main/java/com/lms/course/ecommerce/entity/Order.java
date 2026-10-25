package com.lms.course.ecommerce.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entité Commande (E-Commerce)
 * Représente l'achat d'un module/formation par un client.
 */
@Entity
@Table(name = "ecommerce_orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String orderNumber;

    @Column(nullable = false)
    private String buyerUsername;

    @Column(nullable = false)
    private Long moduleId;

    private String moduleName;

    @Column(nullable = false)
    private Double amount;

    private String currency = "EUR";

    @Column(nullable = false)
    private String status; // PENDING, PAID, CANCELLED, REFUNDED

    private String paymentMethod; // CARD, WAVE, ORANGE_MONEY, SIMULATED

    private String transactionId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime orderDate;

    private LocalDateTime paymentDate;

    public Order() {}

    @PrePersist
    protected void onCreate() {
        if (this.orderDate == null) {
            this.orderDate = LocalDateTime.now();
        }
        if (this.orderNumber == null) {
            this.orderNumber = "ORD-" + System.currentTimeMillis();
        }
        if (this.status == null) {
            this.status = "PENDING";
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getBuyerUsername() { return buyerUsername; }
    public void setBuyerUsername(String buyerUsername) { this.buyerUsername = buyerUsername; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public String getModuleName() { return moduleName; }
    public void setModuleName(String moduleName) { this.moduleName = moduleName; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }

    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }
}
