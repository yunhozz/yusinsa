import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { Cookie } from '../../common/decorator/cookie.decorator';
import { GetUser } from '../../common/decorator/get-user.decorator';
import { ApiResponse } from '../../common/response/api-response';
import { CartResponseDto } from '../../orders/dto/order-response.dto';
import { CreateUserRequestDto, LoginRequestDto } from '../dto/user-request.dto';
import { EmailService } from '../service/email.service';
import { RedisCustomService } from '../service/redis-custom.service';
import { UsersService } from '../service/users.service';
import { Provider } from '../user.enum';
import { GoogleUser, KakaoUser } from '../user.interface';

@Controller('/api/auth')
export class AuthController {
    constructor(
        private readonly userService: UsersService,
        private readonly emailService: EmailService,
        private readonly redisService: RedisCustomService
    ) { }

    /**
     * 유저가 api 를 호출할 때마다 해당 api 실행하여 jwt 토큰의 만료 시간 검증 후 필요 시 재발급
     * @param req: Request
     * @param res: Response
     */
    @Get('/reissue')
    @UseGuards(AuthGuard())
    @HttpCode(HttpStatus.OK)
    async tokenReissue(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<ApiResponse> {
        try {
            const token = req?.headers?.authorization;
            const jwtTokenResponseDto = await this.userService.tokenReissue(token.split(' ')[1]);

            if (jwtTokenResponseDto) {
                // Send JWT access token to front-end with cookie
                const sub = req.user?.['sub'];
                await this.redisService.set(sub, jwtTokenResponseDto.refreshToken, jwtTokenResponseDto.refreshTokenExpiry);
                res.cookie('token', jwtTokenResponseDto.accessToken, {
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    maxAge: 180000 // 3 min
                });
                return ApiResponse.ok(HttpStatus.OK, 'JWT 토큰이 재발행 되었습니다.');
            }
            return ApiResponse.ok(HttpStatus.OK, 'JWT 토큰이 아직 유효합니다.');
        } catch (e) {
            return ApiResponse.fail(e.status, e.message);
        }
    }

    /**
     * 소셜 로그인 페이지 호출
     * @param provider: Provider
     */
    @Get('/:provider')
    @UseGuards(AuthGuard(['google', 'kakao']))
    getSocialLoginPage(@Param('provider') provider: Provider): void { }

    /**
     * 소셜 로그인 콜백 페이지 호출, 소셜 로그인 진행
     * @param provider: Provider
     * @param req: Request
     * @param res: Response
     */
    @Get('/:provider/callback')
    @UseGuards(AuthGuard(['google', 'kakao']))
    @HttpCode(HttpStatus.OK)
    async socialLoginCallback(
        @Param('provider') provider: Provider,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response
    ): Promise<ApiResponse> {
        const reqUser = req.user;
        let user: GoogleUser | KakaoUser;

        switch (provider) {
            case Provider.GOOGLE:
                user = { email: reqUser['email'], firstName: reqUser['firstName'], lastName: reqUser['lastName'] };
                break;
            case Provider.KAKAO:
                user = { email: reqUser['email'], nickname: reqUser['nickname'] };
                break;
            default:
                return ApiResponse.fail(HttpStatus.BAD_REQUEST, '잘못된 소셜 로그인 요청입니다.');
        }
        const jwtTokenResponseDto = await this.userService.loginBySocial(user);
        await this.redisService.set(jwtTokenResponseDto.sub, jwtTokenResponseDto.refreshToken, jwtTokenResponseDto.refreshTokenExpiry);
        // Send JWT access token to front-end with cookie
        res.cookie('token', jwtTokenResponseDto.accessToken, {
            path: '/',
            httpOnly: true,
            secure: true,
            maxAge: 180000 // 3 min
        });
        return ApiResponse.ok(HttpStatus.OK, `${provider} 소셜 로그인에 성공했습니다.`);
    }

    /**
     * 회원가입(guest) & 인증 이메일 발송
     * @param dto: CreateUserRequestDto
     */
    @Post('/join')
    @HttpCode(HttpStatus.CREATED)
    async joinToGuest(@Body(ValidationPipe) dto: CreateUserRequestDto): Promise<ApiResponse> {
        const email = await this.userService.joinToGuest(dto);
        const verifyToken = await this.emailService.generateVerifyToken();
        await this.redisService.set(email, verifyToken);
        await this.emailService.sendJoinVerificationToGuest(email, verifyToken);
        return ApiResponse.ok(HttpStatus.CREATED, '회원 가입을 위해 이메일 인증을 완료해주세요.', email);
    }

    /**
     * 이메일 토큰 인증
     * @param email: string
     * @param verifyToken: string
     */
    @Post('/email-verify')
    @HttpCode(HttpStatus.CREATED)
    async verifyUserJoining(@Query('email') email: string, @Query('token') verifyToken: string): Promise<ApiResponse> {
        const redisToken = await this.redisService.get(email);
        if (redisToken != verifyToken) {
            return ApiResponse.fail(HttpStatus.UNAUTHORIZED, '인증 토큰이 잘못되었습니다.');
        }
        await this.userService.updateGuestToUser(email);
        return ApiResponse.ok(HttpStatus.CREATED, '회원 가입이 완료되었습니다.');
    }

    /**
     * 유저 로그인 (ID, PW)
     * @param dto: LoginRequestDto
     * @param res: Response
     */
    @Post('/login')
    @HttpCode(HttpStatus.CREATED)
    async login(@Body(ValidationPipe) dto: LoginRequestDto, @Res({ passthrough: true }) res: Response): Promise<ApiResponse> {
        const jwtTokenResponseDto = await this.userService.loginById(dto);
        await this.redisService.set(jwtTokenResponseDto.sub, jwtTokenResponseDto.refreshToken, jwtTokenResponseDto.refreshTokenExpiry);
        // Send JWT access token to front-end with cookie
        res.cookie('token', jwtTokenResponseDto.accessToken, {
            path: '/',
            httpOnly: true,
            secure: true,
            maxAge: 180000 // 3 min
        });
        return ApiResponse.ok(HttpStatus.CREATED, '로그인에 성공하였습니다.');
    }

    /**
     * 로그아웃
     * @param id: bigint
     * @param token: string
     * @param cart: CartResponseDto[]
     * @param res: Response
     */
    @Post('/logout')
    @UseGuards(AuthGuard())
    @HttpCode(HttpStatus.CREATED)
    async logout(
        @GetUser() id: bigint,
        @Cookie('token') token: string,
        @Cookie('cart') cart: CartResponseDto[],
        @Res({ passthrough: true }) res: Response
    ): Promise<ApiResponse> {
        if (token) {
            res.clearCookie('token', { path: '/' });
        }
        if (cart) {
            res.clearCookie('cart', { path: '/' });
        }
        await this.redisService.delete(id);
        return ApiResponse.ok(HttpStatus.CREATED, '로그아웃에 성공하였습니다.');
    }

    /**
     * 회원 탈퇴
     * @param id: bigint
     * @param res: Response
     */
    @Patch('/delete')
    @UseGuards(AuthGuard())
    @HttpCode(HttpStatus.CREATED)
    async withdraw(@GetUser() id: bigint, @Res() res: Response): Promise<ApiResponse> {
        await this.userService.deleteUserById(id);
        res.removeHeader('Authentication');
        res.clearCookie('jwt');
        return ApiResponse.ok(HttpStatus.NO_CONTENT, '회원 탈퇴가 완료되었습니다.');
    }
}