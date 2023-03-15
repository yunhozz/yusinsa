import {CacheModule, Module} from '@nestjs/common';
import {UsersModule} from './users/users.module';
import {TypeOrmModule} from "@nestjs/typeorm";
import {typeOrmConfig} from "./config/type-orm.config";
import {APP_GUARD} from "@nestjs/core";
import {RolesGuard} from "./common/guard/roles.guard";

import * as redisStore from 'cache-manager-ioredis';

@Module({
    imports: [
        TypeOrmModule.forRoot(typeOrmConfig),
        CacheModule.register({
            store: redisStore,
            host: 'localhost',
            port: 6379,
            ttl: 0
        }),
        UsersModule
    ],
    providers: [{ provide: APP_GUARD, useClass: RolesGuard }]
})
export class AppModule {}