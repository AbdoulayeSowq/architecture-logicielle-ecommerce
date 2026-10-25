package com.lms.announcement.services;

import com.lms.announcement.entity.Notification;

import java.util.List;

public interface NotificationService {
    List<Notification> getUserNotifications(String userId);
    List<Notification> getUnreadNotifications(String userId);
    Notification sendNotification(Notification notification);
    Notification markAsRead(Long id);
    void markAllAsRead(String userId);
    void deleteNotification(Long id);
}
