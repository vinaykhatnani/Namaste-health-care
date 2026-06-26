package com.project.namaste_health_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class NamasteHealthSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(NamasteHealthSystemApplication.class, args);
    }

}
