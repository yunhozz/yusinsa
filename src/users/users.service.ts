import {BadRequestException, Injectable} from '@nestjs/common';
import {UserRepository} from "./infrastructure/user.repository";
import {User} from "./domain/user.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {JwtService} from "@nestjs/jwt";
import {CreateUserRequestDto, UserLoginRequestDto} from "./dto/user-request.dto";
import {JwtTokenResponseDto, UserProfileResponseDto} from "./dto/user-response.dto";

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