package com.hiliving.email;

public class EmailDeliveryDisabledException extends RuntimeException {
    public EmailDeliveryDisabledException() {
        super("Transactional email delivery is disabled");
    }
}
