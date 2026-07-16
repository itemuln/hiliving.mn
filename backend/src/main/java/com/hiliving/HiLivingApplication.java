package com.hiliving;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class HiLivingApplication {

    public static void main(String[] args) {
        SpringApplication.run(HiLivingApplication.class, args);
    }
}
