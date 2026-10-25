package com.lms.course.ecommerce;

import com.lms.course.ecommerce.controller.OrderController;
import com.lms.course.ecommerce.dto.OrderRequest;
import com.lms.course.ecommerce.entity.Order;
import com.lms.course.ecommerce.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderController orderController;

    private Order sampleOrder;

    @BeforeEach
    void setUp() {
        sampleOrder = new Order();
        sampleOrder.setId(100L);
        sampleOrder.setOrderNumber("ORD-2026-100");
        sampleOrder.setBuyerUsername("soukeyna_sow");
        sampleOrder.setModuleId(5L);
        sampleOrder.setAmount(49.99);
        sampleOrder.setStatus("PENDING");
    }

    @Test
    @DisplayName("POST /api/orders devrait retourner 201 Created")
    void testCreateOrder() {
        OrderRequest request = new OrderRequest(5L, "WAVE");
        when(orderService.createOrder(eq("soukeyna_sow"), any(OrderRequest.class))).thenReturn(sampleOrder);

        ResponseEntity<Order> response = orderController.createOrder(request, "soukeyna_sow", null);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("ORD-2026-100", response.getBody().getOrderNumber());
        verify(orderService, times(1)).createOrder(eq("soukeyna_sow"), any(OrderRequest.class));
    }

    @Test
    @DisplayName("POST /api/orders/{id}/confirm devrait valider le paiement")
    void testConfirmPayment() {
        sampleOrder.setStatus("PAID");
        when(orderService.confirmPayment(100L, "TX-WAVE-001")).thenReturn(sampleOrder);

        ResponseEntity<Order> response = orderController.confirmPayment(100L, Map.of("transactionId", "TX-WAVE-001"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("PAID", response.getBody().getStatus());
        verify(orderService, times(1)).confirmPayment(100L, "TX-WAVE-001");
    }

    @Test
    @DisplayName("GET /api/orders/my-orders devrait lister les commandes de l'utilisateur")
    void testGetMyOrders() {
        when(orderService.getOrdersByBuyer("soukeyna_sow")).thenReturn(Collections.singletonList(sampleOrder));

        ResponseEntity<List<Order>> response = orderController.getMyOrders("soukeyna_sow", null, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        verify(orderService, times(1)).getOrdersByBuyer("soukeyna_sow");
    }
}
