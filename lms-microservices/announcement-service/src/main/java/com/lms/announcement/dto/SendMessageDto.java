package com.lms.announcement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SendMessageDto {
    private String senderUsername;
    private String receiverUsername;
    private String subject;
    private String body;
}
