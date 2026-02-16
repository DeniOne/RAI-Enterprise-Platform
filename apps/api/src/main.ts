import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AllExceptionsFilter } from "./shared/filters/all-exceptions.filter";

async function bootstrap() {
  console.log('Starting bootstrap...');
  const app = await NestFactory.create(AppModule);
  console.log('App created.');
  app.setGlobalPrefix('api');

  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger Documentation (only in development/staging)
  if (process.env.NODE_ENV !== "production") {
    console.log('Setting up Swagger...');
    const config = new DocumentBuilder()
      .setTitle("RAI Enterprise Platform API")
      .setDescription("API documentation for RAI_EP")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
    console.log('Swagger setup complete.');
  }

  console.log('Attempting to listen on port 4000...');
  await app.listen(4000, '0.0.0.0');
  console.log('Server is running on http://0.0.0.0:4000/api');
}
bootstrap();
