import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpExceptionFilter } from './config/exception/http-exception.filter';
import { PipeInterceptor } from './config/exception/pipe.interceptor';
import { TypeOrmConfig } from './config/typeorm/type-orm.config';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';

@Module({
    imports: [
        TypeOrmModule.forRoot(TypeOrmConfig),
        RedisModule.forRoot({
            closeClient: true,
            config: {
                host: '127.0.0.1',
                port: 6379
            }
        }),
        UsersModule,
        OrdersModule
    ],
    providers: [
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: PipeInterceptor }
    ]
})
export class AppModule { }