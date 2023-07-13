import * as config from 'config';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../type/token-payload';
import { Request } from 'express';
import { UserRepository } from '../../users/user.repository';
import { User } from '../../users/user.entity';

const jwtConfig = config.get('jwt');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly userRepository: UserRepository) {
        super({
            secretOrKey : process.env.JWT_SECRET || jwtConfig.secret,
            jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration : true // 토큰 만료 검증은 서버에서 따로 진행,
            // jwtFromRequest : ExtractJwt.fromExtractors([(req: Request) => {
            //     const token = req?.headers?.authorization;
            //     return token.split(' ')[1];
            // }]),
        });
    }

    async validate(req: Request): Promise<TokenPayload> {
        console.log(req);
        const sub = req['sub'];
        const username = req['username'];
        const user: User = await this.userRepository.findOneBy({ id : sub, email : username });

        return {
            sub : user.id,
            username : user.email,
            roles : user.roles
        };
    }
}