package com.lms.course.ecommerce.controller;

import com.lms.course.ecommerce.dto.OrderRequest;
import com.lms.course.ecommerce.entity.Order;
import com.lms.course.ecommerce.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "E-Commerce - Commandes", description = "Endpoints de gestion des commandes et du checkout de formations")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @Operation(summary = "Passer une commande", description = "Crée une commande pour une formation à l'état PENDING.")
    @PostMapping
    public ResponseEntity<Order> createOrder(
            @RequestBody OrderRequest request,
            @RequestHeader(value = "X-Auth-User", required = false) String xAuthUser,
            Authentication authentication) {

        String username = resolveUsername(xAuthUser, authentication);
        Order order = orderService.createOrder(username, request);
        return new ResponseEntity<>(order, HttpStatus.CREATED);
    }

    @Operation(summary = "Confirmer un paiement", description = "Simule la validation bancaire et débloque l'accès à la formation (PAID).")
    @PostMapping("/{id}/confirm")
    public ResponseEntity<Order> confirmPayment(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload) {

        String transactionId = payload != null ? payload.get("transactionId") : null;
        Order confirmed = orderService.confirmPayment(id, transactionId);
        return ResponseEntity.ok(confirmed);
    }

    @Operation(summary = "Mes commandes", description = "Retourne la liste des commandes de l'utilisateur connecté.")
    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(
            @RequestHeader(value = "X-Auth-User", required = false) String xAuthUser,
            @RequestParam(value = "username", required = false) String paramUser,
            Authentication authentication) {

        String username = paramUser != null ? paramUser : resolveUsername(xAuthUser, authentication);
        List<Order> orders = orderService.getOrdersByBuyer(username);
        return ResponseEntity.ok(orders);
    }

    @Operation(summary = "Détail d'une commande", description = "Consulter les informations et le reçu d'une commande par son ID.")
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @Operation(summary = "Toutes les commandes (Admin)", description = "Liste toutes les commandes enregistrées sur la plateforme.")
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    private String resolveUsername(String xAuthUser, Authentication authentication) {
        if (xAuthUser != null && !xAuthUser.isBlank()) {
            return xAuthUser;
        }
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
            return authentication.getName();
        }
        return "student_demo";
    }
}
