import * as config from 'config';
import {PassportStrategy} from "@nestjs/passport";
import {Injectable} from "@nestjs/common";
import {ExtractJwt, Strategy} from "passport-jwt";
import {TokenPayload} from "../../users/dto/token.payload";
import {Request} from "express";
import {UserRepository} from "../../users/user.repository";
import {JwtService} from "@nestjs/jwt";
import {User} from "../../users/user.entity";
import {RedisCustomService} from "../../users/redis-custom.service";

const jwtConfig = config.get('jwt');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
        private readonly redisService: RedisCustomService
    ) {
        super({
            secretOrKey: process.env.JWT_SECRET || jwtConfig.secret,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: true // 토큰 만료 검증은 서버에서 따로 진행
        });
    }

    // 헤더에 있는 jwt 토큰의 payload 에서 email 추출 -> Redis 의 토큰으로 user 검증 -> user email 을 담은 객체 반환
    async validate(req: Request): Promise<TokenPayload> {
        const email = req['email'];
        const token = await this.redisService.get(email);
        const user: User = this.jwtService.verify(token, { secret: jwtConfig.secret });
        return { email : user.email };
    }
}