import {PassportStrategy} from "@nestjs/passport";
import {ExtractJwt, Strategy} from "passport-jwt";
import {Injectable} from "@nestjs/common";

import * as config from 'config';

const jwtConfig = config.get('jwt');

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor() {
        super({
            secretOrKey: jwtConfig.secret,
            jwtFromRequest: ExtractJwt.fromExtractors([req => req.cookies.refreshToken])
        });
    }

    async validate(payload: Record<string, any>) {
        return payload;
    }
}