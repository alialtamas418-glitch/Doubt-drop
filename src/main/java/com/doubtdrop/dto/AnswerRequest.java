package com.doubtdrop.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record AnswerRequest(@NotBlank @Size(max=3000) String answer) {}
