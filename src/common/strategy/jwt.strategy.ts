import * as config from 'config';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../type/token-payload';
import { Request } from 'express';
import { UserRepository } from '../../users/user.repository';

const jwtConfig = config.get('jwt');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly userRepository: UserRepository) {
        super({
            secretOrKey : process.env.JWT_SECRET || jwtConfig.secret,
            jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken(), // 헤더에 있는 토큰을 해석하여 Request 객체에 payload 반환
            ignoreExpiration : true // 토큰 만료 검증은 서버에서 따로 진행,
            // jwtFromRequest : ExtractJwt.fromExtractors([(req: Request) => {
            //     const token = req?.headers?.authorization;
            //     return token.split(' ')[1];
            // }]),
        });
    }

    // JWT payload 를 가지고 유저 검증 -> 인증된 유저일 때 request.user 에 담아서 반환
    async validate(jwtPayload: Request): Promise<TokenPayload> {
        console.log(jwtPayload); // { sub, username, roles, iat, ext }
        const sub = jwtPayload['sub'];
        const username = jwtPayload['username'];
        const user = await this.userRepository.findOneBy({ id : sub, email : username });

        return {
            sub : user.id,
            username : user.email,
            roles : user.roles
        };
    }
}