import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Query,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../../common/decorator/get-user.decorator';
import { Roles } from '../../common/decorator/roles.decorator';
import { PageRequest } from '../../common/pagination/page-request';
import { ApiResponse } from '../../common/response/api-response';
import { RolesGuard } from '../../config/guard/roles.guard';
import { UpdatePasswordRequestDto, UpdateProfileRequestDto } from '../dto/user-request.dto';
import { UserProfileResponseDto } from '../dto/user-response.dto';
import { UsersService } from '../service/users.service';
import { Role } from '../user.enum';

@Controller('/api/users')
export class UsersController {
    constructor(private readonly userService: UsersService) { }

    /**
     * 내 정보 조회
     * @param id: bigint
     */
    @Get('/me')
    @UseGuards(AuthGuard())
    @HttpCode(HttpStatus.OK)
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
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    async getAllUsersPage(@Query('page') pageNo?: number, @Query('size') pageSize?: number): Promise<ApiResponse> {
        const page = new PageRequest(pageNo, pageSize);
        const users = await this.userService.findAllUsersPage(page);
        return ApiResponse.ok(HttpStatus.OK, '유저 리스트 조회에 성공하였습니다.', users);
    }

    /**
     * 특정 유저 정보 조회
     * @param id: bigint
     */
    @Get('/:id')
    @UseGuards(AuthGuard())
    @HttpCode(HttpStatus.OK)
    async getUserInfo(@Param('id', ParseIntPipe) id: bigint): Promise<ApiResponse> {
        const dto = await this.userService.getUserProfileById(id);
        return ApiResponse.ok(HttpStatus.OK, '유저 프로필 조회에 성공하였습니다.', dto);
    }

    /**
     * 유저 비밀번호 변경
     * @param id: bigint
     * @param dto: UpdatePasswordRequestDto
     */
    @Patch('/password')
    @UseGuards(AuthGuard())
    @HttpCode(HttpStatus.CREATED)
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
    @HttpCode(HttpStatus.CREATED)
    async updateProfile(@GetUser() id: bigint, @Body(ValidationPipe) dto: UpdateProfileRequestDto): Promise<ApiResponse> {
        await this.userService.updateProfileById(id, dto);
        return ApiResponse.ok(HttpStatus.CREATED, '프로필 업데이트를 성공적으로 완료했습니다.');
    }
}