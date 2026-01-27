import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpRepository } from '../../repositories/otp.repository';
import { generateOTP, hashOTP, compareOTP } from '../../common/utils/crypto.util';
import { OtpPurpose } from '@prisma/client';

@Injectable()
export class OtpService {
    constructor(
        private otpRepository: OtpRepository,
        private configService: ConfigService,
    ) { }

    /**
     * Generate and store OTP
     */
    async generateAndStore(
        userId: string,
        purpose: OtpPurpose,
        ip?: string,
        userAgent?: string,
    ): Promise<string> {
        const code = generateOTP();
        const codeHash = await hashOTP(code);

        const expiryMinutes = parseInt(this.configService.get('OTP_EXPIRY_MINUTES')) || 10;
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

        await this.otpRepository.create({
            userId,
            purpose,
            codeHash,
            expiresAt,
            ip,
            userAgent,
        });

        return code; // Return plaintext code for sending via email
    }

    /**
     * Verify OTP code
     */
    async verify(
        userId: string,
        code: string,
        purpose: OtpPurpose,
    ): Promise<{ valid: boolean; error?: string; attemptsRemaining?: number }> {
        const otp = await this.otpRepository.findLatestUnused(userId, purpose);

        if (!otp) {
            return { valid: false, error: 'OTP_NOT_FOUND' };
        }

        // Check if expired
        if (new Date() > otp.expiresAt) {
            return { valid: false, error: 'OTP_EXPIRED' };
        }

        // Check if already used
        if (otp.usedAt) {
            return { valid: false, error: 'OTP_ALREADY_USED' };
        }

        // Check max attempts
        const maxAttempts = parseInt(this.configService.get('OTP_MAX_ATTEMPTS')) || 5;
        if (otp.attempts >= maxAttempts) {
            return { valid: false, error: 'MAX_ATTEMPTS_EXCEEDED' };
        }

        // Increment attempts
        await this.otpRepository.incrementAttempts(otp.id);

        // Verify code
        const isValid = await compareOTP(code, otp.codeHash);

        if (!isValid) {
            const attemptsRemaining = maxAttempts - (otp.attempts + 1);
            return { valid: false, error: 'INVALID_OTP', attemptsRemaining };
        }

        // Mark as used
        await this.otpRepository.markAsUsed(otp.id);

        return { valid: true };
    }
}
