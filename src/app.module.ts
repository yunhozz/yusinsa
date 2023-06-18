import {Module} from '@nestjs/common';
import {UsersModule} from './users/users.module';
import {TypeOrmModule} from "@nestjs/typeorm";
import {typeOrmConfig} from "./config/type-orm.config";
import {APP_GUARD} from "@nestjs/core";
import {RolesGuard} from "./common/decorator/roles.guard";
import {RedisModule} from "@liaoliaots/nestjs-redis";
import {OrdersModule} from './orders/orders.module';

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
    ],
    providers : [{ provide : APP_GUARD, useClass : RolesGuard }]
})
export class AppModule {}