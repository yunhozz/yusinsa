import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm/type-orm.config';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { OrdersModule } from './orders/orders.module';

@Module({
    imports : [
        TypeOrmModule.forRoot(typeOrmConfig),
        RedisModule.forRoot({
            closeClient : true,
            config : {
               host : '127.0.0.1',
               port : 6379
            }
        }),
        UsersModule,
        OrdersModule
    ]
})
export class AppModule {}