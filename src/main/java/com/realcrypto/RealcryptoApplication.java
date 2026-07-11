package com.realcrypto;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class RealcryptoApplication {

	public static void main(String[] args) {
		SpringApplication.run(RealcryptoApplication.class, args);
	}

}
