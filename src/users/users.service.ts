import * as config from 'config';
import * as bcrypt from "bcrypt";
import {
    BadRequestException,
    ForbiddenException,
    HttpException,
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
} from "./dto/user-request.dto";
import {JwtTokenResponseDto, UserProfileResponseDto} from "./dto/user-response.dto";
import {TokenPayload} from "./dto/token.payload";
import {Page} from "../common/pagination/page";
import {PageRequest} from "../common/pagination/page-request";
import {RedisCustomService} from "./redis-custom.service";

const jwtConfig = config.get('jwt');

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
        private readonly redisService: RedisCustomService
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
            password : hashedPassword,
            name,
            age,
            gender,
            address : { si, gu, dong, etc },
            phoneNumber,
            roles : [Role.USER]
        });

        return await this.userRepository.save(user);
    }

    async login(dto: LoginRequestDto): Promise<JwtTokenResponseDto> {
        const { email, password } = dto;
        const user: User = await this.userRepository.findOneBy({ email });

        if (user && await bcrypt.compare(password, user.password)) {
            return await this.generateJwtTokens(user.id, user.email, user.roles);

        } else {
            throw new UnauthorizedException(`이메일 또는 비밀번호를 잘못 입력하셨습니다.`);
        }
    }

    // 유저의 api 요청마다 쿠키에 있는 token 값으로 call
    async tokenReissue(token: string): Promise<JwtTokenResponseDto | null> {
        const decode = this.jwtService.decode(token);
        const now: Date = new Date();
        const expire: Date = new Date(decode['exp'] * 1000);
        const min = Math.floor((expire.getTime() - now.getTime()) / (1000 * 60));
        console.log(`남은시간 = ${min}분`);

        // 남은 유효시간이 3분 미만으로 남은 경우
        if (min < 3) {
            try {
                const sub = decode['sub'];
                const username = decode['username'];
                const roles = decode['roles'];
                return await this.generateJwtTokens(sub, username, roles);

            } catch (e) {
                switch (e.message) {
                    case 'INVALID_TOKEN' || 'TOKEN_IS_ARRAY' || 'NO_USER':
                        throw new UnauthorizedException('유효하지 않은 토큰입니다.');

                    case 'EXPIRED_TOKEN':
                        throw new ForbiddenException('토큰이 만료되었습니다.');

                    default:
                        throw new HttpException('서버 오류입니다.', 500);
                }
            }

        } else return null;
    }

    async logout(id: bigint): Promise<void> {
        const user: User = await this.findUserById(id);
        await this.redisService.delete(user.email);
    }

    async findAllUsersPage(page: PageRequest): Promise<Page<User>> {
        const users: User[] = await this.userRepository.find({
            skip : page.getOffset(),
            take : page.getLimit()
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
        await this.userRepository.softDelete({ id : user.id });
    }

    private async findUserById(id: bigint): Promise<User> {
        const user: User = await this.userRepository.findOneBy({ id });
        if (!user) {
            throw new NotFoundException(`해당 유저를 찾을 수 없습니다. id : ${id}`);
        }
        return user;
    }

    private async generateJwtTokens(sub: bigint, username: string, roles: Role[]): Promise<JwtTokenResponseDto> {
        const payload: TokenPayload = { sub, username, roles };
        const secret = jwtConfig.secret;

        const accessToken = this.jwtService.sign(payload, {
            secret : secret,
            expiresIn : jwtConfig.accessToken.expiresIn
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret : secret,
            expiresIn : jwtConfig.refreshToken.expiresIn
        });

        const accessTokenExpiry = jwtConfig.accessToken.expiresIn; // 3600 sec (1h)
        const refreshTokenExpiry = jwtConfig.refreshToken.expiresIn; // 1209600 sec (2w)

        console.log(accessToken);
        await this.redisService.set(username, refreshToken, refreshTokenExpiry);
        const date: Date = new Date(Date.now() + Number(new Date(accessTokenExpiry * 1000)));
        return new JwtTokenResponseDto(accessToken, refreshToken, date);
    }
}