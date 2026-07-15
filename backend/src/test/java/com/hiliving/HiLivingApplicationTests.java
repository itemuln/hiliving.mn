package com.hiliving;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class HiLivingApplicationTests {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void contextLoadsAndFlywayAppliesInitialMigration() {
        Boolean migrationSucceeded = jdbcTemplate.queryForObject(
                "select success from flyway_schema_history where version = '1'",
                Boolean.class
        );

        assertThat(migrationSucceeded).isTrue();
    }
}
