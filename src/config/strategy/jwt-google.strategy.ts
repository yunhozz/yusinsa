import { PassportStrategy } from '@nestjs/passport';
import * as config from 'config';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GoogleUser } from '../../users/user.interface';

const oauthConfig = config.get('oauth');

export class JwtGoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor() {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID || oauthConfig.google.clientID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || oauthConfig.google.clientSecret,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || oauthConfig.google.callbackURL,
            scope: ['email', 'profile']
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): Promise<void> {
        try {
            const { emails, name } = profile;
            const googleUser: GoogleUser = {
                email: emails[0].value,
                firstName: name.familyName,
                lastName: name.givenName
            };
            done(null, googleUser);
        } catch (err) {
            done(err);
        }
    }
}

/*
1. http://localhost:3000/api/auth/google 로 Google 로그인 화면 요청
2. 사용자가 로그인 요청을 보낼 때 client ID, client secret, redirect URL, scope 을 함께 파라미터로 보냄
3. Google 에서 로그인을 성공적으로 마치고 http://localhost:3000/api/auth/google/callback 주소로 리다이렉트 요청을 보냄 -> validate
4. 서버에서는 사용자의 요청에 따라 DB 에 사용자 정보 저장, JWT 토큰 발급
 */