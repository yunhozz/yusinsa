import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
        origin: ['http://localhost'],
        credentials: true,
    });
    app.use(cookieParser());
    await app.listen(3000);
}
bootstrap();