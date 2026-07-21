package com.hiliving.email;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class EmailConfiguration {
    @Bean
    Clock applicationClock() {
        return Clock.systemUTC();
    }
}
