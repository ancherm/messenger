package ru.redcode.poster.server;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class ServerApplication {

	public static void main(String[] args) {

//		String useDotenv = System.getProperty("USE_DOTENV", "true");
//		if ("true".equals(useDotenv)) {
//			Dotenv dotenv = Dotenv.load();
//			dotenv.entries().forEach(entry ->
//					System.setProperty(entry.getKey(), entry.getValue())
//			);
//		}

		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
		dotenv.entries().forEach(
				dotenvEntry -> System.setProperty(dotenvEntry.getKey(), dotenvEntry.getValue())
		);

		TimeZone.setDefault(TimeZone.getTimeZone("UTC+04:00"));

		SpringApplication.run(ServerApplication.class, args);
	}

}
