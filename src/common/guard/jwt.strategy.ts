import {PassportStrategy} from "@nestjs/passport";
import {Injectable} from "@nestjs/common";
import {ExtractJwt, Strategy} from "passport-jwt";
import {TokenPayload} from "../../users/dto/token.payload";
import {UsersService} from "../../users/users.service";
import {User} from "../../users/user.entity";
import {Request} from "express";

import * as config from 'config';

const jwtConfig = config.get('jwt');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly userService: UsersService
    ) {
        super({
            secretOrKey: process.env.JWT_SECRET || jwtConfig.secret,
            jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => req?.cookies?.Authentication])
        });
    }

    async validate(payload: TokenPayload): Promise<User> {
        return await this.userService.findUserById(payload.id);
    }
}