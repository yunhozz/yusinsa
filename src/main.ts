import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import {AppModule} from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin : ['http://localhost'],
    credentials : true
  });
  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
