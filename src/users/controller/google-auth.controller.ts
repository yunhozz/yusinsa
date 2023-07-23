import { Controller, Get, HttpCode, HttpStatus, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiResponse } from '../../common/response/api-response';
import { UsersService } from '../service/users.service';
import { GoogleUser } from '../user.interface';

@Controller('/api/auth/google')
export class GoogleAuthController {
    constructor(private readonly userService: UsersService) { }

    @Get()
    @UseGuards(AuthGuard('google'))
    async getGoogleAuth(@Req() req: Request): Promise<void> { }

    @Get('/callback')
    @UseGuards(AuthGuard('google'))
    @HttpCode(HttpStatus.CREATED)
    async googleAuthCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<ApiResponse> {
        const googleUser: GoogleUser = { email: req.user?.['email'], firstName: req.user?.['firstName'], lastName: req.user?.['lastName'] };
        await this.userService.loginByGoogle(googleUser);
        return ApiResponse.ok(HttpStatus.CREATED, '구글 로그인에 성공했습니다.');
    }
}