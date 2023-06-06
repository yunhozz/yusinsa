import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
    ValidationPipe
} from '@nestjs/common';
import {UsersService} from "./users.service";
import {JwtTokenResponseDto, UserProfileResponseDto} from "./dto/user.response.dto";
import {
    CreateUserRequestDto,
    LoginRequestDto,
    UpdatePasswordRequestDto,
    UpdateProfileRequestDto
} from "./dto/user.request.dto";
import {User} from "./user.entity";
import {GetUser} from "../common/decorator/get-user.decorator";
import {ApiResponse} from "../common/response/api-response";
import {Request, Response} from "express";
import {Page} from "../common/pagination/page";
import {PageRequest} from "../common/pagination/page-request";
import {AuthGuard} from "@nestjs/passport";

@Controller('/api/users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    /**
     * 내 정보 조회
     * @param id: bigint
     */
    @Get('/me')
    @UseGuards(AuthGuard())
    async getMyInfo(@GetUser() id: bigint): Promise<ApiResponse> {
        const dto: UserProfileResponseDto = await this.userService.getUserProfileById(id);
        return ApiResponse.ok(HttpStatus.OK, '내 정보 조회에 성공하였습니다.', dto);
    }

    /**
     * 유저 페이징 리스트 조회
     * @param pageNo: number
     * @param pageSize: number
     */
    @Get('/q')
    @UseGuards(AuthGuard())
    async getAllUsersPage(@Query('pageNo') pageNo?: number, @Query('pageSize') pageSize?: number): Promise<ApiResponse> {
        const page: PageRequest = new PageRequest(pageNo, pageSize);
        const users: Page<User> = await this.userService.findAllUsersPage(page);
        return ApiResponse.ok(HttpStatus.OK, '유저 리스트 조회에 성공하였습니다.', users);
    }

    /**
     * 유저가 api 를 호출할 때마다 해당 api 실행하여 jwt 토큰의 만료 시간 검증 후 필요 시 재발급
     * @param req: Request
     * @param res: Response
     */
    @Get('/reissue')
    async tokenReissue(@Req() req: Request, @Res({ passthrough : true }) res: Response): Promise<ApiResponse> {
        try {
            const token = req?.headers?.authorization;
            const result: JwtTokenResponseDto = await this.userService.tokenReissue(token.split(' ')[1]);

            if (result) {
                // Send JWT access token to front-end with cookie
                res.cookie('token', result.accessToken, {
                    path : '/',
                    httpOnly : true,
                    secure : true,
                    maxAge : 180000 // 3 min
                });
                return ApiResponse.ok(HttpStatus.CREATED, 'JWT 토큰이 재발행 되었습니다.');
            }

            return ApiResponse.ok(HttpStatus.CREATED, 'JWT 토큰이 아직 유효합니다.');

        } catch (e) {
            return ApiResponse.fail(e.status, e.message);
        }
    }

    /**
     * 특정 유저 정보 조회
     * @param id: bigint
     */
    @Get('/:id')
    @UseGuards(AuthGuard())
    async getUserInfo(@Param('id', ParseIntPipe) id: bigint): Promise<ApiResponse> {
        const dto: UserProfileResponseDto = await this.userService.getUserProfileById(id);
        return ApiResponse.ok(HttpStatus.OK, '유저 프로필 조회에 성공하였습니다.', dto);
    }

    /**
     * 회원가입
     * @param dto: CreateUserRequestDto
     */
    @Post('/join')
    async join(@Body(ValidationPipe) dto: CreateUserRequestDto): Promise<ApiResponse> {
        const user: User = await this.userService.join(dto);
        return ApiResponse.ok(HttpStatus.CREATED, '회원가입에 성공하였습니다.', {
            id : user.id,
            email : user.email
        });
    }

    /**
     * 유저 로그인 (ID, PW)
     * @param dto: LoginRequestDto
     * @param res: Response
     */
    @Post('/login')
    async login(@Body(ValidationPipe) dto: LoginRequestDto, @Res({ passthrough : true }) res: Response): Promise<ApiResponse> {
        const jwtTokenResponseDto: JwtTokenResponseDto = await this.userService.login(dto);
        // Send JWT access token to front-end with cookie
        res.cookie('token', jwtTokenResponseDto.accessToken, {
            path : '/',
            httpOnly : true,
            secure : true,
            maxAge : 180000 // 3 min
        });
        console.log(`Bearer ${jwtTokenResponseDto.accessToken}`);

        return ApiResponse.ok(HttpStatus.CREATED, '로그인에 성공하였습니다.');
    }

    /**
     * 로그아웃
     * @param id: bigint
     * @param req: Request
     * @param res: Response
     */
    @Post('/logout')
    @UseGuards(AuthGuard())
    async logout(@GetUser() id: bigint, @Req() req: Request, @Res({ passthrough : true }) res: Response): Promise<ApiResponse> {
        try {
            const token = req?.cookies?.token;
            if (token) {
                res.clearCookie('token', { path : '/' })
            }

            await this.userService.logout(id);
            return ApiResponse.ok(HttpStatus.CREATED, '로그아웃에 성공하였습니다.');

        } catch (e) {
            return ApiResponse.fail(e.status, e.message);
        }
    }

    /**
     * 유저 비밀번호 변경
     * @param id: bigint
     * @param dto: UpdatePasswordRequestDto
     */
    @Patch('/password')
    @UseGuards(AuthGuard())
    async updatePassword(@GetUser() id: bigint, @Body(ValidationPipe) dto: UpdatePasswordRequestDto): Promise<ApiResponse> {
        await this.userService.updatePassword(id, dto);
        return ApiResponse.ok(HttpStatus.CREATED, '패스워드 업데이트를 성공적으로 완료했습니다.');
    }

    /**
     * 유저 프로필 정보 변경
     * @param id: bigint
     * @param dto: UpdateProfileRequestDto
     */
    @Patch('/profile')
    @UseGuards(AuthGuard())
    async updateProfile(@GetUser() id: bigint, @Body(ValidationPipe) dto: UpdateProfileRequestDto): Promise<ApiResponse> {
        await this.userService.updateProfileById(id, dto);
        return ApiResponse.ok(HttpStatus.CREATED, '프로필 업데이트를 성공적으로 완료했습니다.');
    }

    /**
     * 회원 탈퇴
     * @param id: bigint
     * @param res: Response
     */
    @Patch('/delete')
    @UseGuards(AuthGuard())
    async withdraw(@GetUser() id: bigint, @Res() res: Response): Promise<ApiResponse> {
        await this.userService.deleteUserById(id);
        res.removeHeader('Authentication');
        res.clearCookie('jwt');
        return ApiResponse.ok(HttpStatus.CREATED, '회원 탈퇴가 완료되었습니다.');
    }
}