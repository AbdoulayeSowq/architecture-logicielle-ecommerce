package com.lms.course.ecommerce.service.impl;

import com.lms.course.ecommerce.dto.OrderRequest;
import com.lms.course.ecommerce.entity.Order;
import com.lms.course.ecommerce.repository.OrderRepository;
import com.lms.course.ecommerce.service.OrderService;
import com.lms.course.entity.CModule;
import com.lms.course.exception.NotFoundException;
import com.lms.course.repository.ModuleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class OrderServiceImpl implements OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

    private final OrderRepository orderRepository;
    private final ModuleRepository moduleRepository;

    @Autowired(required = false)
    private KafkaTemplate<String, Object> kafkaTemplate;

    public OrderServiceImpl(OrderRepository orderRepository, ModuleRepository moduleRepository) {
        this.orderRepository = orderRepository;
        this.moduleRepository = moduleRepository;
    }

    @Override
    public Order createOrder(String buyerUsername, OrderRequest request) {
        if (request.getModuleId() == null) {
            throw new IllegalArgumentException("Module ID must not be null");
        }

        CModule module = moduleRepository.findById(request.getModuleId())
                .orElseThrow(() -> new NotFoundException("Formation introuvable avec l'ID: " + request.getModuleId()));

        Order order = new Order();
        order.setOrderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setBuyerUsername(buyerUsername != null ? buyerUsername : "anonymous_customer");
        order.setModuleId(module.getId());
        order.setModuleName(module.getName());
        order.setAmount(module.getPrice() != null ? module.getPrice() : 49.99);
        order.setCurrency(module.getCurrency() != null ? module.getCurrency() : "EUR");
        order.setStatus("PENDING");
        order.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "SIMULATED");
        order.setOrderDate(LocalDateTime.now());

        Order saved = orderRepository.save(order);
        log.info("Commande créée avec succès: #{} pour l'utilisateur {} (Montant: {} {})",
                saved.getOrderNumber(), saved.getBuyerUsername(), saved.getAmount(), saved.getCurrency());

        return saved;
    }

    @Override
    public Order confirmPayment(Long orderId, String transactionId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Commande introuvable avec l'ID: " + orderId));

        order.setStatus("PAID");
        order.setTransactionId(transactionId != null ? transactionId : "TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setPaymentDate(LocalDateTime.now());

        Order confirmed = orderRepository.save(order);
        log.info("Paiement validé pour la commande #{}. Formation '{}' débloquée pour {}.",
                confirmed.getOrderNumber(), confirmed.getModuleName(), confirmed.getBuyerUsername());

        // Publication événementielle asynchrone (Kafka) si disponible
        if (kafkaTemplate != null) {
            try {
                String eventPayload = String.format("{\"event\":\"OrderConfirmed\",\"orderId\":%d,\"user\":\"%s\",\"moduleId\":%d,\"amount\":%.2f}",
                        confirmed.getId(), confirmed.getBuyerUsername(), confirmed.getModuleId(), confirmed.getAmount());
                kafkaTemplate.send("order.events", String.valueOf(confirmed.getId()), eventPayload);
                log.info("Événement OrderConfirmed publié sur Kafka (topic: order.events)");
            } catch (Exception e) {
                log.warn("Impossible de publier sur Kafka (mode dégradé): {}", e.getMessage());
            }
        }

        return confirmed;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Order> getOrdersByBuyer(String buyerUsername) {
        return orderRepository.findByBuyerUsernameOrderByOrderDateDesc(buyerUsername);
    }

    @Override
    @Transactional(readOnly = true)
    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Commande introuvable avec l'ID: " + orderId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
}
