import {Module} from '@nestjs/common';
import {UsersModule} from './users/users.module';
import {TypeOrmModule} from "@nestjs/typeorm";
import {typeOrmConfig} from "./config/type-orm.config";
import {APP_GUARD} from "@nestjs/core";
import {RolesGuard} from "./common/guard/roles.guard";
import {CacheModule} from "@nestjs/cache-manager";

@Module({
    imports: [
        TypeOrmModule.forRoot(typeOrmConfig),
        CacheModule.register({
            isGlobal: true,
            host: 'localhost',
            port: 6379,
            ttl: 0
        }),
        UsersModule
    ],
    providers: [{ provide: APP_GUARD, useClass: RolesGuard }]
})
export class AppModule {}