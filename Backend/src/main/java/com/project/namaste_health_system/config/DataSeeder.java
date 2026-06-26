package com.project.namaste_health_system.config;

import com.project.namaste_health_system.entity.DiseaseSynonym;
import com.project.namaste_health_system.repository.DiseaseSynonymRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private DiseaseSynonymRepository repository;

    @Override
    public void run(String... args) throws Exception {
        if (repository.count() == 0) {
            List<DiseaseSynonym> initialData = Arrays.asList(
                    DiseaseSynonym.builder().inputName("स्तनाचा कर्करोग").standardName("breast cancer").build(),
                    DiseaseSynonym.builder().inputName("breast tumor").standardName("breast cancer").build(),
                    DiseaseSynonym.builder().inputName("mammary carcinoma").standardName("breast cancer").build(),
                    DiseaseSynonym.builder().inputName("bukhar").standardName("fever").build(),
                    DiseaseSynonym.builder().inputName("ज्वर").standardName("fever").build()
            );
            repository.saveAll(initialData);
        }
    }
}
