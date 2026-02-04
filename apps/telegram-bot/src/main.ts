import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(4002);
  console.log('🤖 Telegram Bot microservice running on port 4002');
}
bootstrap();
