import {Module} from '@nestjs/common';
import {UsersController} from './users.controller';
import {UsersService} from './users.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "./user.entity";
import {TypeOrmCustomModule} from "../config/type-orm.custom.module";
import {UserRepository} from "./user.repository";
import {PassportModule} from "@nestjs/passport";
import {JwtModule} from "@nestjs/jwt";
import {JwtStrategy} from "../common/guard/jwt.strategy";
import {JwtRefreshStrategy} from "../common/guard/jwt-refresh.strategy";
import {RedisCustomService} from "./redis-custom.service";

import * as config from 'config';

const jwtConfig = config.get('jwt');

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        TypeOrmCustomModule.forCustomRepository([UserRepository]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || jwtConfig.secret,
            signOptions: { expiresIn: jwtConfig.expiresIn },
        }),
        PassportModule.register({ defaultStrategy: 'jwt' })
    ],
    controllers: [UsersController],
    providers: [UsersService, JwtStrategy, JwtRefreshStrategy, RedisCustomService],
    exports: [JwtStrategy, JwtRefreshStrategy, PassportModule]
})
export class UsersModule {}