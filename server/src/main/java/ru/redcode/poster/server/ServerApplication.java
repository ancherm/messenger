package ru.redcode.poster.server;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class ServerApplication {

	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.load();
		dotenv.entries().forEach(
				dotenvEntry ->  System.setProperty(dotenvEntry.getKey(), dotenvEntry.getValue())
		);

		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));

		SpringApplication.run(ServerApplication.class, args);
	}

}
