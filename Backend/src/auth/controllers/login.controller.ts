import {
    Controller,
    Post,
    Body,
    Ip,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginService } from '../services/login.service';
import { LoginDto } from '../dto/login.dto';
import { TwoFactorLoginDto } from '../dto/two-factor-login.dto';
import { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class LoginController {
    constructor(private readonly loginService: LoginService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful (or 2FA required)' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(
        @Body() dto: LoginDto,
        @Ip() ip: string,
        @Req() req: Request,
    ) {
        return this.loginService.login(dto, ip, req.headers['user-agent']);
    }

    @Post('login/2fa')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Complete 2FA login' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid code or token' })
    async verifyTwoFactor(
        @Body() dto: TwoFactorLoginDto,
        @Ip() ip: string,
        @Req() req: Request,
    ) {
        return this.loginService.verifyTwoFactor(dto, ip, req.headers['user-agent']);
    }
}
