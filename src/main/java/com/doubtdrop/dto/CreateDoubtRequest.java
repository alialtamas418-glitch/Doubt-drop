package com.doubtdrop.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record CreateDoubtRequest(@NotBlank @Size(max=40) String subject,
 @NotBlank @Size(max=160) String title,@Size(max=2000) String details,@Size(max=60) String topic) {}
