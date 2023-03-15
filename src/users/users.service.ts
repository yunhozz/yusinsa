import {BadRequestException, Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {UserRepository} from "./user.repository";
import {Role, User} from "./user.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {JwtService} from "@nestjs/jwt";
import {CreateUserRequestDto, LoginRequestDto, UpdateProfileRequestDto} from "./dto/user-request.dto";
import {JwtTokenResponseDto, UserProfileResponseDto} from "./dto/user-response.dto";

import * as config from 'config';
import * as bcrypt from "bcrypt";

const jwtConfig = config.get('jwt');

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService
    ) {}

    async join(dto: CreateUserRequestDto): Promise<User> {
        const { email, password, name, age, gender, si, gu, dong, etc, phoneNumber } = dto;
        const found = await this.userRepository.findOneBy({ email });

        if (found) {
            throw new BadRequestException(`중복되는 이메일이 존재합니다. 현재 입력: ${dto.email}`);
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        const user: User = await this.userRepository.create({
            email,
            password: hashedPassword,
            name,
            age,
            gender,
            address: { si, gu, dong, etc },
            phoneNumber,
            roles: [Role.USER]
        });

        return await this.userRepository.save(user);
    }

    async login(dto: LoginRequestDto): Promise<JwtTokenResponseDto> {
        const { email, password } = dto;
        const user = await this.userRepository.findOneBy({ email });

        if (user && await bcrypt.compare(password, user.password)) {
            const accessToken = this.jwtService.sign(user);
            let date = new Date();
            date.setSeconds(date + jwtConfig.expiresIn);

            return { accessToken, expiredDate: date };

        } else {
            throw new UnauthorizedException(`이메일 또는 비밀번호를 잘못 입력하셨습니다.`);
        }
    }

    async findUserById(id: bigint): Promise<User> {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) {
            throw new NotFoundException(`해당 유저를 찾을 수 없습니다. id : ${id}`);
        }

        return user;
    }

    async findAllUsers(): Promise<User[]> {
        return await this.userRepository.find();
    }

    async getUserProfileById(id: bigint): Promise<UserProfileResponseDto> {
        const user = await this.findUserById(id);
        return {
            name: user.name,
            age: user.age,
            gender: user.gender
        };
    }

    async updateProfileById(id: bigint, dto: UpdateProfileRequestDto): Promise<UserProfileResponseDto> {
        const { name, age, gender, si, gu, dong, etc, phoneNumber } = dto;
        const user = await this.findUserById(id);

        user.name = name;
        user.age = age;
        user.gender = gender;
        user.address = { si, gu, dong, etc };
        user.phoneNumber = phoneNumber;
        await this.userRepository.save(user);

        return {
            name: user.name,
            age: user.age,
            gender: user.gender
        };
    }

    async deleteUserById(id: bigint): Promise<void> {
        const user = await this.findUserById(id);
        await this.userRepository.softDelete({ id: user.id });
    }
}