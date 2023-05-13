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
    UseGuards,
    ValidationPipe
} from '@nestjs/common';
import {UsersService} from "./users.service";
import {AuthGuard} from "@nestjs/passport";
import {JwtTokenResponseDto, UserProfileResponseDto} from "./dto/user.response.dto";
import {
    CreateUserRequestDto,
    LoginRequestDto,
    UpdatePasswordRequestDto,
    UpdateProfileRequestDto
} from "./dto/user.request.dto";
import {User} from "./user.entity";
import {GetUser} from "../common/decorator/get-user.decorator";
import {Response} from "../common/response/response";
import {Request, response} from "express";
import {Page} from "../common/pagination/page";
import {PageRequest} from "../common/pagination/page-request";

@Controller('/api/users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    @Get('/q')
    // @UseGuards(AuthGuard())
    async getAllUsersPage(@Query('pageNo', ParseIntPipe) pageNo, @Query('pageSize', ParseIntPipe) pageSize): Promise<Response> {
        const page: PageRequest = new PageRequest(pageNo, pageSize);
        const users: Page<User> = await this.userService.findAllUsersPage(page);
        return Response.ok(HttpStatus.OK, '유저 리스트 조회에 성공하였습니다.', users);
    }

    @Get('/:id')
    @UseGuards(AuthGuard())
    async getUserInfo(@Param('id', ParseIntPipe) id: bigint): Promise<Response> {
        const userProfileResponseDto: UserProfileResponseDto = await this.userService.getUserProfileById(id);
        return Response.ok(HttpStatus.OK, '유저 프로필 조회에 성공하였습니다.', userProfileResponseDto);
    }

    @Post('/join')
    async join(@Body(ValidationPipe) dto: CreateUserRequestDto): Promise<Response> {
        const user: User = await this.userService.join(dto);
        return Response.ok(HttpStatus.CREATED, '회원가입에 성공하였습니다.', {
            id: user.id,
            email: user.email
        });
    }

    @Post('/login')
    @UseGuards(AuthGuard())
    async login(@Body(ValidationPipe) dto: LoginRequestDto): Promise<Response> {
        const jwtTokenResponseDto: JwtTokenResponseDto = await this.userService.login(dto);
        response.setHeader('Authentication', jwtTokenResponseDto.accessToken);
        response.cookie('token', jwtTokenResponseDto.accessToken, {
            httpOnly: true,
            expires: jwtTokenResponseDto.accessTokenExpiredDate
        });

        return Response.ok(HttpStatus.CREATED, '로그인에 성공하였습니다.');
    }

    // TODO: jwt 토큰 재발행, 로그아웃 api
    @Post('/reissue')
    async tokenReissue(req: Request): Promise<Response> {
        return Response.ok(HttpStatus.CREATED, 'JWT 토큰이 재발행 되었습니다.');
    }

    @Post('/logout')
    async logout(): Promise<Response> {
        return Response.ok(HttpStatus.CREATED, '로그아웃에 성공하였습니다.');
    }

    @Patch('/password')
    async updatePassword(
        @GetUser('id', ParseIntPipe) id: bigint,
        @Body(ValidationPipe) dto: UpdatePasswordRequestDto
    ): Promise<Response> {
        await this.userService.updatePassword(id, dto);
        return Response.ok(HttpStatus.CREATED, '패스워드 업데이트를 성공적으로 완료했습니다.');
    }

    @Patch('/profile')
    async updateProfile(
        @GetUser('id', ParseIntPipe) id: bigint,
        @Body(ValidationPipe) dto: UpdateProfileRequestDto
    ): Promise<Response> {
        await this.userService.updateProfileById(id, dto);
        return Response.ok(HttpStatus.CREATED, '프로필 업데이트를 성공적으로 완료했습니다.');
    }

    @Patch('/delete')
    async withdraw(@GetUser('id', ParseIntPipe) id: bigint): Promise<Response> {
        await this.userService.deleteUserById(id);
        response.removeHeader('Authentication');
        response.clearCookie('jwt');
        return Response.ok(HttpStatus.CREATED, '회원 탈퇴가 완료되었습니다.');
    }
}