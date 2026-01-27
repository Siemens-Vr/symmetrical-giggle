import { Controller, Post, Get, Body, UseGuards, Req, Query, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SignupService } from '../services/signup.service';
import { TempAuthGuard } from '../guards/temp-auth.guard';
import { InitiateSignupDto } from '../dto/initiate-signup.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { SetPasswordDto } from '../dto/set-password.dto';
import { CompleteIndividualDto } from '../dto/complete-individual.dto';
import { CompleteOrganizationDto } from '../dto/complete-organization.dto';

@ApiTags('signup')
@Controller('auth/signup')
export class SignupController {
    constructor(private signupService: SignupService) { }

    @Post('initiate')
    @HttpCode(200)
    @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 requests per 15 minutes
    @ApiOperation({ summary: 'Initiate signup with email' })
    @ApiResponse({ status: 200, description: 'OTP sent successfully' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
    async initiateSignup(@Body() dto: InitiateSignupDto, @Req() req: any) {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];
        return this.signupService.initiateSignup(dto.email, ip, userAgent);
    }

    @Post('verify-otp')
    @HttpCode(200)
    @ApiOperation({ summary: 'Verify OTP code' })
    @ApiResponse({ status: 200, description: 'OTP verified successfully' })
    @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
    async verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.signupService.verifyOtp(dto.email, dto.code);
    }

    @Post('resend-otp')
    @HttpCode(200)
    @Throttle({ default: { limit: 1, ttl: 60000 } }) // 1 request per 60 seconds
    @ApiOperation({ summary: 'Resend OTP code' })
    @ApiResponse({ status: 200, description: 'New OTP sent successfully' })
    @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
    async resendOtp(@Body() dto: InitiateSignupDto, @Req() req: any) {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];
        return this.signupService.resendOtp(dto.email, ip, userAgent);
    }

    @Post('set-password')
    @HttpCode(200)
    @UseGuards(TempAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Set password after email verification' })
    @ApiResponse({ status: 200, description: 'Password set successfully' })
    @ApiResponse({ status: 400, description: 'Weak password' })
    @ApiResponse({ status: 401, description: 'Invalid or expired token' })
    async setPassword(@Body() dto: SetPasswordDto, @Req() req: any) {
        return this.signupService.setPassword(req.user.id, dto.password);
    }

    @Post('complete-individual')
    @HttpCode(200)
    @UseGuards(TempAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Complete individual account signup' })
    @ApiResponse({ status: 200, description: 'Signup completed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid data or age restriction' })
    @ApiResponse({ status: 401, description: 'Invalid or expired token' })
    async completeIndividual(@Body() dto: CompleteIndividualDto, @Req() req: any) {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];
        return this.signupService.completeIndividual(req.user.id, dto, ip, userAgent);
    }

    @Post('complete-organization')
    @HttpCode(200)
    @UseGuards(TempAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Complete organization account signup' })
    @ApiResponse({ status: 200, description: 'Signup completed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid data' })
    @ApiResponse({ status: 401, description: 'Invalid or expired token' })
    @ApiResponse({ status: 409, description: 'Slug already taken' })
    async completeOrganization(@Body() dto: CompleteOrganizationDto, @Req() req: any) {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];
        return this.signupService.completeOrganization(req.user.id, dto, ip, userAgent);
    }

    @Get('check-slug')
    @ApiOperation({ summary: 'Check organization slug availability' })
    @ApiResponse({ status: 200, description: 'Slug availability checked' })
    async checkSlug(@Query('slug') slug: string) {
        return this.signupService.checkSlugAvailability(slug);
    }
}
