package com.lms.course.ecommerce.dto;

public class OrderRequest {
    private Long moduleId;
    private String paymentMethod; // CARD, WAVE, ORANGE_MONEY, SIMULATED

    public OrderRequest() {}

    public OrderRequest(Long moduleId, String paymentMethod) {
        this.moduleId = moduleId;
        this.paymentMethod = paymentMethod;
    }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}
