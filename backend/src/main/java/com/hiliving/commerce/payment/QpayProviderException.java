package com.hiliving.commerce.payment;

public class QpayProviderException extends RuntimeException {
    private final String code;

    public QpayProviderException(String code, String message) {
        super(message);
        this.code = code;
    }

    public QpayProviderException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() { return code; }
}
