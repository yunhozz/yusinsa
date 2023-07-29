import {
    BadRequestException,
    ForbiddenException,
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as config from 'config';
import { EntityNotFoundError } from 'typeorm';
import { Page } from '../../common/pagination/page';
import { PageRequest } from '../../common/pagination/page-request';
import {
    CreateUserRequestDto,
    LoginRequestDto,
    UpdatePasswordRequestDto,
    UpdateProfileRequestDto,
} from '../dto/user-request.dto';
import { JwtTokenResponseDto, UserProfileResponseDto } from '../dto/user-response.dto';
import { LocalUser, SocialUser, User } from '../user.entity';
import { Provider, Role } from '../user.enum';
import { GoogleUser, KakaoUser, TokenPayload } from '../user.interface';
import { LocalUserRepository, SocialUserRepository, UserRepository } from '../user.repository';

const jwtConfig = config.get('jwt');

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: UserRepository,
        @InjectRepository(LocalUser)
        private readonly localUserRepository: LocalUserRepository,
        @InjectRepository(SocialUser)
        private readonly socialUserRepository: SocialUserRepository,
        private readonly jwtService: JwtService
    ) { }

    async joinToGuest(dto: CreateUserRequestDto): Promise<string> {
        const { email, password, name, age, gender, si, gu, dong, etc, phoneNumber } = dto;
        const found = await this.localUserRepository.exist({ where: { email } });

        if (found) {
            throw new BadRequestException(`중복되는 이메일이 존재합니다. email: ${email}`);
        }
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        const localUser = this.localUserRepository.create({
            email,
            name,
            provider: Provider.LOCAL,
            password: hashedPassword,
            age,
            gender,
            address: { si, gu, dong, etc },
            phoneNumber
        });

        await this.localUserRepository.save(localUser);
        return localUser.email;
    }

    async updateGuestToUser(email: string): Promise<void> {
        const localUser = await this.findLocalUserByEmail(email);
        await this.localUserRepository.update({ id: localUser.id }, { role: Role.USER });
    }

    async loginById(dto: LoginRequestDto): Promise<JwtTokenResponseDto> {
        const { email, password } = dto;
        const localUser = await this.findLocalUserByEmail(email);

        if (localUser && await bcrypt.compare(password, localUser.password)) {
            return await this.generateJwtTokens(localUser.id, localUser.email, localUser.role);
        } else {
            throw new UnauthorizedException(`이메일 또는 비밀번호를 잘못 입력하셨습니다.`);
        }
    }

    async loginBySocial(user: GoogleUser | KakaoUser): Promise<JwtTokenResponseDto> {
        const socialUser = this.getUserBySocialProvider(user);
        let oldUser = await this.userRepository.findOneBy({ email: socialUser.email });

        if (oldUser) {
            await this.userRepository.update({ id: oldUser.id }, { name: socialUser.name, provider: user.provider, role: Role.USER });
            return this.generateJwtTokens(oldUser.id, oldUser.email, oldUser.role);
        } else {
            const newUser = this.socialUserRepository.create({ email: socialUser.email, name: socialUser.name, provider: user.provider, role: Role.USER });
            await this.socialUserRepository.save(newUser);
            return this.generateJwtTokens(newUser.id, newUser.email, newUser.role);
        }
    }

    async tokenReissue(token: string): Promise<JwtTokenResponseDto | null> {
        const decode = this.jwtService.decode(token);
        const now = new Date();
        const expire = new Date(decode['exp'] * 1000);
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

    async findAllUsersPage(page: PageRequest): Promise<Page<User>> {
        const users = await this.userRepository.find({
            select: ['email', 'name', 'provider', 'role', 'updatedAt'],
            skip: page.getOffset(),
            take: page.getLimit()
        });

        const totalCount = await this.userRepository.count();
        const pageSize = page.pageSize;
        return new Page(pageSize, totalCount, users);
    }

    async getUserProfileById(id: bigint): Promise<UserProfileResponseDto> {
        const localUser = await this.findLocalUserById(id);
        return new UserProfileResponseDto(localUser);
    }

    async updatePassword(id: bigint, dto: UpdatePasswordRequestDto): Promise<void> {
        // 기존 비밀번호 입력 -> 새 비밀번호 입력 -> 비밀번호 확인
        const { oldPassword, newPassword, checkPassword } = dto;
        const localUser = await this.findLocalUserById(id);

        if (!await bcrypt.compare(oldPassword, localUser.password)) {
            throw new BadRequestException('기존 비밀번호와 다릅니다.');
        }
        if (newPassword !== checkPassword) {
            throw new BadRequestException('업데이트할 비밀번호와 일치하지 않습니다.');
        }
        const salt = await bcrypt.genSalt();
        const password = await bcrypt.hash(newPassword, salt);
        await this.localUserRepository.update({ id: localUser['id'] }, { password });
    }

    async updateProfileById(id: bigint, dto: UpdateProfileRequestDto): Promise<UserProfileResponseDto> {
        const localUser = await this.findLocalUserById(id);
        await this.localUserRepository.update({ id: localUser.id }, dto);
        return new UserProfileResponseDto(localUser);
    }

    async deleteUserById(id: bigint): Promise<void> {
        const user = await this.findUserById(id);
        await this.userRepository.softDelete({ id: user.id });
    }

    private async generateJwtTokens(sub: bigint, username: string, role: Role): Promise<JwtTokenResponseDto> {
        const payload: TokenPayload = { sub, username, role };
        const secret = jwtConfig.secret;

        const accessToken = this.jwtService.sign(payload, {
            secret: secret,
            expiresIn: jwtConfig.accessToken.expiresIn
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: secret,
            expiresIn: jwtConfig.refreshToken.expiresIn
        });

        const refreshTokenExpiry = jwtConfig.refreshToken.expiresIn; // 1209600 sec (2w)
        return new JwtTokenResponseDto(sub, accessToken, refreshToken, refreshTokenExpiry);
    }

    private getUserBySocialProvider(user: GoogleUser | KakaoUser): { email: string, name: string } {
        let socialUser: { email: string, name: string };
        switch (user.provider) {
            case Provider.GOOGLE:
                socialUser = { email: user.email, name: user['firstName'] + user['lastName'] };
                break;
            case Provider.KAKAO:
                socialUser = { email: user.email, name: user['nickname'] };
                break;
            default:
                throw new BadRequestException(`잘못된 소셜 로그인 요청입니다. provider: ${user.provider}`);
        }
        return socialUser;
    }

    private async findUserById(id: bigint): Promise<User> {
        return await this.userRepository.findOneByOrFail({ id })
            .catch(e => {
                if (e instanceof EntityNotFoundError) {
                    throw new NotFoundException(`유저를 찾을 수 없습니다.`);
                } else {
                    throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
                }
            });
    }

    private async findLocalUserById(id: bigint): Promise<LocalUser> {
        return await this.localUserRepository.findOneByOrFail({ id })
            .catch(e => {
                if (e instanceof EntityNotFoundError) {
                    throw new NotFoundException(`유저를 찾을 수 없습니다.`);
                } else {
                    throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
                }
            });
    }

    private async findLocalUserByEmail(email: string): Promise<LocalUser> {
        return await this.localUserRepository.findOneByOrFail({ email })
            .catch(e => {
                if (e instanceof EntityNotFoundError) {
                    throw new NotFoundException(`해당 이메일의 유저를 찾을 수 없습니다. email: ${email}`);
                } else {
                    throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
                }
            });
    }
}