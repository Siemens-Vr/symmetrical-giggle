import { Controller, Post, Body, Req, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ForgotPasswordService } from '../services/forgot-password.service';
import { TempAuthGuard } from '../guards/temp-auth.guard';
import { InitiateResetDto } from '../dto/initiate-reset.dto';
import { VerifyResetCodeDto } from '../dto/verify-reset-code.dto';
import { CompleteResetDto } from '../dto/complete-reset.dto';

@ApiTags('auth')
@Controller('auth/password')
export class ForgotPasswordController {
    constructor(private forgotPasswordService: ForgotPasswordService) { }

    @Post('reset/initiate')
    @HttpCode(200)
    @ApiOperation({ summary: 'Initiate password reset' })
    @ApiResponse({ status: 200, description: 'Reset code sent if account exists' })
    async initiateReset(@Body() dto: InitiateResetDto, @Req() req: any) {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];
        return this.forgotPasswordService.initiateReset(dto.email, ip, userAgent);
    }

    @Post('reset/verify')
    @HttpCode(200)
    @ApiOperation({ summary: 'Verify password reset code' })
    @ApiResponse({ status: 200, description: 'Code verified, returns temp token' })
    @ApiResponse({ status: 400, description: 'Invalid code' })
    async verifyResetCode(@Body() dto: VerifyResetCodeDto) {
        return this.forgotPasswordService.verifyResetCode(dto.email, dto.code);
    }

    @Post('reset/complete')
    @HttpCode(200)
    @UseGuards(TempAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Set new password using temp token' })
    @ApiResponse({ status: 200, description: 'Password reset successful' })
    @ApiResponse({ status: 400, description: 'Weak password' })
    @ApiResponse({ status: 401, description: 'Invalid or expired token' })
    async completeReset(@Body() dto: CompleteResetDto, @Req() req: any) {
        return this.forgotPasswordService.completeReset(req.user.id, dto.newPassword);
    }
}
