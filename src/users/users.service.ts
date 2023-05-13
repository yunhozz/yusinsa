import {
    BadRequestException,
    CACHE_MANAGER,
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common';
import {UserRepository} from "./user.repository";
import {Role, User} from "./user.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {JwtService} from "@nestjs/jwt";
import {
    CreateUserRequestDto,
    LoginRequestDto,
    UpdatePasswordRequestDto,
    UpdateProfileRequestDto
} from "./dto/user.request.dto";
import {JwtTokenResponseDto, UserProfileResponseDto} from "./dto/user.response.dto";
import {Cache} from "cache-manager";
import {TokenPayload} from "./dto/token.payload";
import {Page} from "../common/pagination/page";
import {PageRequest} from "../common/pagination/page-request";

import * as config from 'config';
import * as bcrypt from "bcrypt";

const jwtConfig = config.get('jwt');

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache
    ) {}

    async join(dto: CreateUserRequestDto): Promise<User> {
        const { email, password, name, age, gender, si, gu, dong, etc, phoneNumber } = dto;
        const found: User = await this.userRepository.findOneBy({ email });

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
        const user: User = await this.userRepository.findOneBy({ email });

        if (user && await bcrypt.compare(password, user.password)) {
            const accessToken = this.generateAccessToken(user.id);
            const refreshToken = this.generateRefreshToken(user.email);
            await this.cacheManager.set(email, refreshToken, jwtConfig.refreshToken.expiresIn);

            let date: Date = new Date();
            date.setSeconds(date + jwtConfig.refreshToken.expiresIn);
            return new JwtTokenResponseDto(accessToken, refreshToken, date);

        } else {
            throw new UnauthorizedException(`이메일 또는 비밀번호를 잘못 입력하셨습니다.`);
        }
    }

    async findUserById(id: bigint): Promise<User> {
        const user: User = await this.userRepository.findOneBy({ id });
        if (!user) {
            throw new NotFoundException(`해당 유저를 찾을 수 없습니다. id : ${id}`);
        }

        return user;
    }

    async findAllUsersPage(page: PageRequest): Promise<Page<User>> {
        const users: User[] = await this.userRepository.find({
            skip: page.getOffset(),
            take: page.getLimit()
        });
        const totalCount = await this.userRepository.count();
        const pageSize = page.pageSize;
        return new Page(pageSize, totalCount, users);
    }

    async getUserProfileById(id: bigint): Promise<UserProfileResponseDto> {
        const user: User = await this.findUserById(id);
        return new UserProfileResponseDto(user);
    }

    async updatePassword(id: bigint, dto: UpdatePasswordRequestDto): Promise<void> {
        // 기존 비밀번호 입력 -> 새 비밀번호 입력 -> 비밀번호 확인
        const { oldPassword, newPassword, checkPassword } = dto;
        const user: User = await this.findUserById(id);

        if (!await bcrypt.compare(oldPassword, user.password)) {
            throw new BadRequestException(`기존 비밀번호와 다릅니다.`);
        }

        if (newPassword !== checkPassword) {
            throw new BadRequestException(`업데이트할 비밀번호와 일치하지 않습니다.`)
        }

        const salt = await bcrypt.genSalt();
        const password = await bcrypt.hash(newPassword, salt);

        user.updatePassword(password);
        await this.userRepository.save(user);
    }

    async updateProfileById(id: bigint, dto: UpdateProfileRequestDto): Promise<UserProfileResponseDto> {
        const { name, age, gender, si, gu, dong, etc, phoneNumber } = dto;
        const user: User = await this.findUserById(id);

        user.updateProfile(name, age, gender, { si, gu, dong, etc }, phoneNumber);
        await this.userRepository.save(user);
        return new UserProfileResponseDto(user);
    }

    async deleteUserById(id: bigint): Promise<void> {
        const user: User = await this.findUserById(id);
        await this.userRepository.softDelete({ id: user.id });
    }

    private generateAccessToken(id: bigint): string {
        const payload: TokenPayload = { id };
        return this.jwtService.sign(payload, {
            secret: jwtConfig.secret,
            expiresIn: jwtConfig.accessToken.expiresIn
        });
    }

    private generateRefreshToken(email: string): string {
        return this.jwtService.sign(email, {
            secret: jwtConfig.secret,
            expiresIn: jwtConfig.refreshToken.expiresIn
        });
    }
}