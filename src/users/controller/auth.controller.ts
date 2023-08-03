import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
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
     * @param req Request
     * @param res Response
     */
    @Get('/reissue')
    @UseGuards(AuthGuard())
    @HttpCode(HttpStatus.OK)
    async tokenReissue(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<ApiResponse> {
        try {
            const token = req?.headers?.authorization;
            const jwtTokenResponseDto = await this.userService.tokenReissue(token.split(' ')[1]);

            if (jwtTokenResponseDto) {
                const sub = req.user?.['sub'];
                await this.redisService.set(sub, jwtTokenResponseDto.refreshToken, jwtTokenResponseDto.refreshTokenExpiry);
                this.storeAccessTokenOnCookie(res, jwtTokenResponseDto.accessToken);
                return ApiResponse.ok(HttpStatus.OK, 'JWT 토큰이 재발행 되었습니다.');
            }
            return ApiResponse.ok(HttpStatus.OK, 'JWT 토큰이 아직 유효합니다.');
        } catch (e) {
            return ApiResponse.fail(e.status, e.message);
        }
    }

    /**
     * 구글 소셜 로그인 페이지 호출
     */
    @Get('/google')
    @UseGuards(AuthGuard('google'))
    @HttpCode(HttpStatus.OK)
    getGoogleLoginPage(): void { }

    /**
     * 카카오 소셜 로그인 페이지 호출
     */
    @Get('/kakao')
    @UseGuards(AuthGuard('kakao'))
    @HttpCode(HttpStatus.OK)
    getKakaoLoginPage(): void { }

    /**
     * 구글 소셜 로그인
     * @param req Request
     * @param res Response
     */
    @Get('/google/callback')
    @UseGuards(AuthGuard('google'))
    @HttpCode(HttpStatus.CREATED)
    async googleLoginCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<ApiResponse> {
        const googleUser: GoogleUser = { provider: Provider.GOOGLE, email: req.user['email'], firstName: req.user['firstName'], lastName: req.user['lastName'] };
        const jwtTokenResponseDto = await this.userService.loginBySocial(googleUser);
        await this.redisService.set(jwtTokenResponseDto.sub, jwtTokenResponseDto.refreshToken, jwtTokenResponseDto.refreshTokenExpiry);
        this.storeAccessTokenOnCookie(res, jwtTokenResponseDto.accessToken);
        return ApiResponse.ok(HttpStatus.CREATED, '구글 로그인에 성공했습니다.');
    }

    /**
     * 카카오 소셜 로그인
     * @param req Request
     * @param res Response
     */
    @Get('/kakao/callback')
    @UseGuards(AuthGuard('kakao'))
    @HttpCode(HttpStatus.CREATED)
    async kakaoLoginCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<ApiResponse> {
        const kakaoUser: KakaoUser = { provider: Provider.KAKAO, email: req.user['email'], nickname: req.user['nickname'] };
        const jwtTokenResponseDto = await this.userService.loginBySocial(kakaoUser);
        await this.redisService.set(jwtTokenResponseDto.sub, jwtTokenResponseDto.refreshToken, jwtTokenResponseDto.refreshTokenExpiry);
        this.storeAccessTokenOnCookie(res, jwtTokenResponseDto.accessToken);
        return ApiResponse.ok(HttpStatus.CREATED, '카카오 로그인에 성공했습니다.')
    }

    /**
     * 회원가입(guest) & 인증 이메일 발송
     * @param dto CreateUserRequestDto
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
     * @param email string
     * @param verifyToken string
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
     * @param dto LoginRequestDto
     * @param res Response
     */
    @Post('/login')
    @HttpCode(HttpStatus.CREATED)
    async login(@Body(ValidationPipe) dto: LoginRequestDto, @Res({ passthrough: true }) res: Response): Promise<ApiResponse> {
        const jwtTokenResponseDto = await this.userService.loginById(dto);
        await this.redisService.set(jwtTokenResponseDto.sub, jwtTokenResponseDto.refreshToken, jwtTokenResponseDto.refreshTokenExpiry);
        this.storeAccessTokenOnCookie(res, jwtTokenResponseDto.accessToken);
        return ApiResponse.ok(HttpStatus.CREATED, '로그인에 성공하였습니다.');
    }

    /**
     * 로그아웃
     * @param id bigint
     * @param token string
     * @param cart CartResponseDto[]
     * @param res Response
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
     * @param id bigint
     * @param res Response
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

    private storeAccessTokenOnCookie(res: Response, accessToken: string): void {
        res.cookie('token', accessToken, {
            path: '/',
            httpOnly: true,
            secure: true,
            maxAge: 180000 // 3 min
        });
    }
}