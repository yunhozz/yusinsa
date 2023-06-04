import * as config from 'config';
import {PassportStrategy} from "@nestjs/passport";
import {HttpException, Injectable} from "@nestjs/common";
import {ExtractJwt, Strategy} from "passport-jwt";
import {TokenPayload} from "../../users/dto/token.payload";
import {Request} from "express";
import {UserRepository} from "../../users/user.repository";
import {JwtService} from "@nestjs/jwt";
import {RedisCustomService} from "../../users/redis-custom.service";
import {UsersService} from "../../users/users.service";

const jwtConfig = config.get('jwt');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private readonly redisService: RedisCustomService
    ) {
        super({
            secretOrKey: process.env.JWT_SECRET || jwtConfig.secret,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: true
        });
    }

    // 로그인 시 jwtFromRequest 옵션에 의해 Request 에 jwt payload 전달
    // 유효한 토큰일 시 유저 이메일을 담은 TokenPayload 반환
    async validate(req: Request, payload: TokenPayload): Promise<TokenPayload> {
        const now: Date = new Date();
        const tokenExp: Date = new Date(req['exp'] * 1000);
        const between = Math.floor((tokenExp.getTime() - now.getTime()) / (1000 * 60)); // 남은 시간(분)

        // 만료된 경우 or 3분 미만으로 남은 경우
        if (between < 3) {
            const email = req['email'];
            const user = await this.userRepository.findOneBy({ email });
            const refreshToken = await this.redisService.get(user.email);

            try {
                this.jwtService.verify(refreshToken, { secret: jwtConfig.secret });
                const jwtTokens = this.userService.generateJwtToken(user.email);
                await this.redisService.set(email, jwtTokens.refreshToken, jwtConfig.refreshToken.expiresIn);

            } catch (e) {
                switch (e.message) {
                    case 'INVALID_TOKEN' || 'TOKEN_IS_ARRAY' || 'NO_USER':
                        throw new HttpException('유효하지 않은 토큰입니다.', 401);

                    case 'EXPIRED_TOKEN':
                        throw new HttpException('토큰이 만료되었습니다.', 410);

                    default:
                        throw new HttpException('서버 오류입니다.', 500);
                }
            }
        }

        return payload;
    }
}