package com.fomag.convocatoria.config;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
public class PagosDataSourceConfig {

    @Bean
    @ConfigurationProperties("spring.pagos.datasource")
    public DataSourceProperties pagosDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "pagosDataSource")
    public DataSource pagosDataSource(@Qualifier("pagosDataSourceProperties") DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().build();
    }

    @Bean(name = "pagosJdbcTemplate")
    public JdbcTemplate pagosJdbcTemplate(@Qualifier("pagosDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    @Bean(name = "pagosTransactionManager")
    public PlatformTransactionManager pagosTransactionManager(@Qualifier("pagosDataSource") DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
