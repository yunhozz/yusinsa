import {Module} from '@nestjs/common';
import {UsersController} from './users.controller';
import {UsersService} from './users.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "./domain/user.entity";
import {TypeOrmCustomModule} from "../config/type-orm-custom.module";
import {UserRepository} from "./user.repository";
import {PassportModule, PassportStrategy} from "@nestjs/passport";
import {JwtModule} from "@nestjs/jwt";
import {JwtStrategy} from "./jwt/jwt.strategy";

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
    providers: [UsersService, JwtStrategy],
    exports: [JwtStrategy, PassportStrategy]
})
export class UsersModule {}