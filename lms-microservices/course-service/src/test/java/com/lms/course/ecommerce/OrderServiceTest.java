package com.lms.course.ecommerce;

import com.lms.course.ecommerce.dto.OrderRequest;
import com.lms.course.ecommerce.entity.Order;
import com.lms.course.ecommerce.repository.OrderRepository;
import com.lms.course.ecommerce.service.impl.OrderServiceImpl;
import com.lms.course.entity.CModule;
import com.lms.course.exception.NotFoundException;
import com.lms.course.repository.ModuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ModuleRepository moduleRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    private CModule testModule;

    @BeforeEach
    void setUp() {
        testModule = new CModule();
        testModule.setId(10L);
        testModule.setName("Architecture Logicielle & Microservices");
        testModule.setCodeEC("ARCH101");
        testModule.setPrice(79.99);
        testModule.setCurrency("EUR");
    }

    @Test
    @DisplayName("Devrait créer une commande avec statut PENDING et prix correct")
    void testCreateOrder_Success() {
        when(moduleRepository.findById(10L)).thenReturn(Optional.of(testModule));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(1L);
            return o;
        });

        OrderRequest request = new OrderRequest(10L, "WAVE");
        Order created = orderService.createOrder("soukeyna_sow", request);

        assertNotNull(created);
        assertEquals(1L, created.getId());
        assertEquals("soukeyna_sow", created.getBuyerUsername());
        assertEquals(10L, created.getModuleId());
        assertEquals("Architecture Logicielle & Microservices", created.getModuleName());
        assertEquals(79.99, created.getAmount());
        assertEquals("EUR", created.getCurrency());
        assertEquals("PENDING", created.getStatus());
        assertEquals("WAVE", created.getPaymentMethod());
        assertNotNull(created.getOrderNumber());

        verify(moduleRepository, times(1)).findById(10L);
        verify(orderRepository, times(1)).save(any(Order.class));
    }

    @Test
    @DisplayName("Devrait lever NotFoundException si la formation n'existe pas")
    void testCreateOrder_ModuleNotFound() {
        when(moduleRepository.findById(999L)).thenReturn(Optional.empty());

        OrderRequest request = new OrderRequest(999L, "CARD");

        assertThrows(NotFoundException.class, () -> orderService.createOrder("soukeyna_sow", request));
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("Devrait confirmer le paiement et basculer le statut en PAID")
    void testConfirmPayment_Success() {
        Order pendingOrder = new Order();
        pendingOrder.setId(42L);
        pendingOrder.setOrderNumber("ORD-2026-TEST");
        pendingOrder.setBuyerUsername("soukeyna_sow");
        pendingOrder.setModuleId(10L);
        pendingOrder.setModuleName("Architecture Logicielle & Microservices");
        pendingOrder.setAmount(79.99);
        pendingOrder.setStatus("PENDING");

        when(orderRepository.findById(42L)).thenReturn(Optional.of(pendingOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order confirmed = orderService.confirmPayment(42L, "TX-WAVE-12345");

        assertNotNull(confirmed);
        assertEquals("PAID", confirmed.getStatus());
        assertEquals("TX-WAVE-12345", confirmed.getTransactionId());
        assertNotNull(confirmed.getPaymentDate());

        verify(orderRepository, times(1)).findById(42L);
        verify(orderRepository, times(1)).save(pendingOrder);
    }

    @Test
    @DisplayName("Devrait lister les commandes de l'acheteur")
    void testGetOrdersByBuyer() {
        Order order = new Order();
        order.setId(1L);
        order.setBuyerUsername("soukeyna_sow");
        order.setStatus("PAID");

        when(orderRepository.findByBuyerUsernameOrderByOrderDateDesc("soukeyna_sow"))
                .thenReturn(Collections.singletonList(order));

        List<Order> orders = orderService.getOrdersByBuyer("soukeyna_sow");

        assertEquals(1, orders.size());
        assertEquals("soukeyna_sow", orders.get(0).getBuyerUsername());
        verify(orderRepository, times(1)).findByBuyerUsernameOrderByOrderDateDesc("soukeyna_sow");
    }
}
