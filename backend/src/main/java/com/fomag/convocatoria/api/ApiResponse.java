package com.fomag.convocatoria.api;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ApiResponse<T> {
    T data;
    ErrorData error;

    @Value
    @Builder
    public static class ErrorData {
        String code;
        String message;
    }
}
