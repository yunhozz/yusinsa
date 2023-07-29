import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import * as config from 'config';
import { Profile, Strategy } from 'passport-kakao';
import { Provider } from '../../users/user.enum';
import { KakaoUser } from '../../users/user.interface';

const oauthConfig = config.get('oauth');

@Injectable()
export class JwtKakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
    constructor() {
        super({
            clientID: process.env.KAKAO_CLIENT_ID || oauthConfig.kakao.clientID,
            clientSecret: process.env.KAKAO_CLIENT_SECRET || oauthConfig.kakao.clientSecret,
            callbackURL: process.env.KAKAO_CALLBACK_URL || oauthConfig.kakao.callbackURL
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile, done: (error: any, user?: any, info?: any) => void): Promise<any> {
        try {
            const { _json } = profile;
            const kakaoUser: KakaoUser = {
                provider: Provider.KAKAO,
                email: _json.kakao_account.email,
                nickname: _json.properties.nickname,
                photo: _json.properties.thumbnail_image
            };
            done(null, kakaoUser);
        } catch (err) {
            done(err);
        }
    }
}