import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from '../../repositories/user.repository';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { hashPassword, validatePasswordStrength } from '../../common/utils/password.util';
import { OtpPurpose } from '@prisma/client';

@Injectable()
export class ForgotPasswordService {
    constructor(
        private prisma: PrismaService,
        private userRepository: UserRepository,
        private otpService: OtpService,
        private tokenService: TokenService,
        @InjectQueue('email') private emailQueue: Queue,
    ) { }

    async initiateReset(email: string, ip?: string, userAgent?: string) {
        // 1. Find user (don't reveal if they exist or not for security, but we need to know internally)
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            // For security, still return success but don't send anything
            return {
                success: true,
                message: 'If an account exists with this email, a reset code has been sent.',
            };
        }

        // Email-based rate limiting (similar to signup)
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const recentOtpsCount = await this.prisma.emailOtp.count({
            where: {
                userId: user.id,
                purpose: OtpPurpose.RESET_PASSWORD,
                createdAt: { gte: oneHourAgo },
            },
        });

        if (recentOtpsCount >= 5) {
            throw new BadRequestException({
                success: false,
                error: 'TOO_MANY_REQUESTS',
                message: 'Maximum reset attempts reached for this email. Please try again in an hour.',
            });
        }

        // 2. Generate and store OTP
        const otpCode = await this.otpService.generateAndStore(
            user.id,
            OtpPurpose.RESET_PASSWORD,
            ip,
            userAgent,
        );

        // 3. Queue email
        await this.emailQueue.add('send-reset-otp', {
            email: user.email,
            code: otpCode,
        });

        return {
            success: true,
            message: 'If an account exists with this email, a reset code has been sent.',
        };
    }

    async verifyResetCode(email: string, code: string) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new BadRequestException({
                success: false,
                error: 'INVALID_CODE',
                message: 'Invalid email or code',
            });
        }

        const { valid } = await this.otpService.verify(user.id, code, OtpPurpose.RESET_PASSWORD);
        if (!valid) {
            throw new BadRequestException({
                success: false,
                error: 'INVALID_CODE',
                message: 'Invalid email or code',
            });
        }

        // Generate temp token for next step
        const tempToken = this.tokenService.generateTempToken(user.id, user.email, 'reset-password');

        return {
            success: true,
            message: 'Code verified successfully',
            tempToken,
        };
    }

    async completeReset(userId: string, newPassword: string) {
        // 1. Validate password strength
        if (!validatePasswordStrength(newPassword)) {
            throw new BadRequestException({
                success: false,
                error: 'WEAK_PASSWORD',
                message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
            });
        }

        // 2. Hash and update password
        const passwordHash = await hashPassword(newPassword);
        await this.userRepository.setPassword(userId, passwordHash);

        // 3. Invalidate ALL sessions for this user (security best practice on password change)
        await this.prisma.session.updateMany({
            where: { userId },
            data: {
                status: 'REVOKED',
                revokedAt: new Date(),
                revokeReason: 'PASSWORD_RESET',
            },
        });

        return {
            success: true,
            message: 'Password has been reset successfully. Please log in with your new password.',
        };
    }
}
