import {BadRequestException, Injectable} from '@nestjs/common';
import {UserRepository} from "./infrastructure/user.repository";
import {CreateUserRequestDto} from "./dto/request/create-user.request";
import {User} from "./domain/user.entity";
import {UserLoginRequestDto} from "./dto/request/user-login.request";
import {InjectRepository} from "@nestjs/typeorm";
import {JwtService} from "@nestjs/jwt";
import {JwtTokenResponseDto} from "./dto/response/jwt-token.response";
import {UserProfileResponseDto} from "./dto/response/user-profile.response";

import * as config from 'config';

const jwtConfig = config.get('jwt');

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService
    ) {}

    async join(dto: CreateUserRequestDto): Promise<User> {
        const user = await this.userRepository.findOneBy({ email: dto.email });
        if (user) {
            throw new BadRequestException(`중복되는 이메일이 존재합니다. 현재 입력: ${dto.email}`);
        }

        return this.userRepository.createUser(dto);
    }

    async login(dto: UserLoginRequestDto): Promise<JwtTokenResponseDto> {
        const payload = await this.userRepository.validateLogin(dto);
        const accessToken = this.jwtService.sign(payload);

        let date = new Date();
        date.setSeconds(date + jwtConfig.expiresIn);

        return {
            accessToken,
            expiredDate: date
        };
    }

    async getUserProfileById(id: bigint): Promise<UserProfileResponseDto> {
        return await this.userRepository.findOneProfileById(id);
    }
}