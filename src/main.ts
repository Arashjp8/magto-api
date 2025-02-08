import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix("api/v2");

    app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
    );

    app.enableCors({
        origin: process.env.CLIENT_URL_LOCAL,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        allowedHeaders: "Content-Type, Authorization",
    });

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
