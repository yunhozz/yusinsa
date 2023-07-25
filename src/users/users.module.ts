import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as config from 'config';
import { JwtGoogleStrategy } from '../config/strategy/jwt-google.strategy';
import { JwtKakaoStrategy } from '../config/strategy/jwt-kakao.strategy';
import { JwtStrategy } from '../config/strategy/jwt.strategy';
import { TypeOrmCustomModule } from '../config/typeorm/type-orm.custom.module';
import { AuthController } from './controller/auth.controller';
import { UsersController } from './controller/users.controller';
import { EmailService } from './service/email.service';
import { RedisCustomService } from './service/redis-custom.service';
import { UsersService } from './service/users.service';
import { LocalUser, User } from './user.entity';
import { LocalUserRepository, UserRepository } from './user.repository';

const jwtConfig = config.get('jwt');

@Module({
    imports: [
        TypeOrmModule.forFeature([User, LocalUser]),
        TypeOrmCustomModule.forCustomRepository([UserRepository, LocalUserRepository]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || jwtConfig.secret,
            signOptions: { expiresIn: jwtConfig.accessToken.expiresIn }
        }),
        PassportModule.register({ defaultStrategy: 'jwt' })
    ],
    controllers: [UsersController, AuthController],
    providers: [UsersService, EmailService, RedisCustomService, JwtStrategy, JwtGoogleStrategy, JwtKakaoStrategy],
    exports: [PassportModule, JwtStrategy, JwtGoogleStrategy, JwtKakaoStrategy]
})
export class UsersModule { }

/**
 * <Module 속성>
 * 1. imports : 해당 모듈에서 필요한 모듈의 집합. 여기에 들어가는 모듈은 프로바이더를 노출하는 모듈임.
 * 2. controllers : 이 모듈 안에서 정의된, 인스턴스화 되어야 하는 컨트롤러의 집합.
 * 3. providers : Nest 인젝터(Injector)가 인스턴스화 시키고, 적어도 이 모듈 안에서 공유하는 프로바이더.
 * 4. exports : 해당 모듈에서 제공하는 프로바이더의 부분 집합. 이 모듈을 가져오는 다른 모듈에서 사용할 수 있도록 노출할 프로바이더
 */