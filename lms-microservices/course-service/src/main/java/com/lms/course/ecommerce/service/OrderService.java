package com.lms.course.ecommerce.service;

import com.lms.course.ecommerce.dto.OrderRequest;
import com.lms.course.ecommerce.entity.Order;

import java.util.List;

public interface OrderService {

    Order createOrder(String buyerUsername, OrderRequest request);

    Order confirmPayment(Long orderId, String transactionId);

    List<Order> getOrdersByBuyer(String buyerUsername);

    Order getOrderById(Long orderId);

    List<Order> getAllOrders();
}
