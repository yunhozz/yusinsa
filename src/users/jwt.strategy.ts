import {PassportStrategy} from "@nestjs/passport";
import {Injectable, UnauthorizedException} from "@nestjs/common";
import {ExtractJwt, Strategy} from "passport-jwt";
import {InjectRepository} from "@nestjs/typeorm";
import {Role, User} from "./user.entity";
import {UserRepository} from "./user.repository";

import * as config from 'config';

const jwtConfig = config.get('jwt');

export interface JwtPayload {
    email: string;
    roles: Role[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: UserRepository
    ) {
        super({
            secretOrKey: process.env.JWT_SECRET || jwtConfig.secret,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        });
    }

    async validate(payload: JwtPayload): Promise<User> {
        const user = await this.userRepository.findOneBy({ email: payload.email });
        if (!user) {
            throw new UnauthorizedException();
        }

        return user;
    }
}