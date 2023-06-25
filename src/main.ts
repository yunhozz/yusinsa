import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import {AppModule} from "./app.module";
import {HttpExceptionFilter} from "./common/exception/http-exception.filter";
import {ValidationExceptionFilter} from "./common/exception/validation-exception.filter";
import {PipeInterceptor} from "./common/exception/pipe.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin : ['http://localhost'],
    credentials : true
  });
  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter(), new ValidationExceptionFilter())
  app.useGlobalInterceptors(new PipeInterceptor())
  await app.listen(3000);
}
bootstrap();