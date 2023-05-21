import {PassportStrategy} from "@nestjs/passport";
import {Injectable, Logger} from "@nestjs/common";
import {UserRepository} from "../../users/user.repository";
import {ExtractJwt, Strategy} from "passport-jwt";
import {TokenPayload} from "../../users/dto/token.payload";
import {User} from "../../users/user.entity";
import {Request} from "express";

import * as config from 'config';

const jwtConfig = config.get('jwt');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {

    private readonly logger: Logger = new Logger(JwtStrategy.name);

    constructor(private readonly userRepository: UserRepository) {
        super({
            secretOrKey: process.env.JWT_SECRET || jwtConfig.secret,
            jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => {
                const token = req?.cookies?.token;
                this.logger.log(`Access Token: ${token}`);
                return token;
            }])
        });
    }

    async validate(payload: TokenPayload): Promise<User> {
        const email = payload.email;
        this.logger.log(`Validated User: ${email}`);
        return await this.userRepository.findOneBy({ email });
    }
}