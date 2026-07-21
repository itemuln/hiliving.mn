package com.hiliving.email;

import com.hiliving.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import static org.junit.jupiter.api.Assumptions.assumeTrue;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class ManualEmailDeliveryIT {
    @Autowired EmailProperties properties;
    @Autowired SmtpTransactionalEmailService smtp;

    @Test
    void sendExplicitNonProductionConfigurationTest() {
        assumeTrue(properties.deliveryEnabled() && properties.manualTestEnabled(),
                "Set EMAIL_DELIVERY_ENABLED=true and EMAIL_MANUAL_TEST_ENABLED=true explicitly");
        assumeTrue(properties.testRecipient() != null && !properties.testRecipient().isBlank(),
                "Set EMAIL_TEST_RECIPIENT explicitly");
        smtp.sendManualConfigurationTest(properties.testRecipient());
    }
}
