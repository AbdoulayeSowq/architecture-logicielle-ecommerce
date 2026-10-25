package com.lms.announcement.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class MaintenanceDto extends AnnouncementDto {
    @NotNull(message = "Maintenance start time is required")
    @Future(message = "Maintenance start must be in the future")
    private LocalDateTime maintenanceStart;
    
    @NotNull(message = "Maintenance end time is required")
    @Future(message = "Maintenance end must be in the future")
    private LocalDateTime maintenanceEnd;
    
    @NotNull(message = "Maintenance services description is required")
    private String maintenanceServices;
    
    private String maintenanceContact;
}
