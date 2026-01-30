import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from '../../repositories/user.repository';
import { OtpService } from './otp.service';
import { generateSecret, verify } from 'otplib';
import { TwoFactorMethod, OtpPurpose } from '@prisma/client';

@Injectable()
export class TwoFactorService {
    constructor(
        private prisma: PrismaService,
        private userRepository: UserRepository,
        private otpService: OtpService,
    ) { }

    /**
     * Generate TOTP Secret
     */
    async generateSecret(userId: string) {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new BadRequestException('User not found');

        // Renaming the local variable to avoid conflict with the class method name
        const secretValue = generateSecret();

        // Manual otpauth URL construction
        const label = encodeURIComponent(`VRStore:${user.email}`);
        const issuer = encodeURIComponent('VRStore');
        const otpauthUrl = `otpauth://totp/${label}?secret=${secretValue}&issuer=${issuer}`;

        return {
            secret: secretValue,
            otpauthUrl,
        };
    }

    /**
     * Enable 2FA
     */
    async enable(userId: string, code: string, method: TwoFactorMethod, secret?: string) {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new BadRequestException('User not found');

        if (method === TwoFactorMethod.TOTP) {
            if (!secret) throw new BadRequestException('TOTP secret is required to enable');

            // otplib.verify returns a Promise<VerifyResult>
            const result = await verify({ token: code, secret });
            if (!result.valid) throw new BadRequestException('Invalid authentication code');

            // Save secret and enable
            await this.prisma.twoFactor.upsert({
                where: { userId },
                update: {
                    enabled: true,
                    method: TwoFactorMethod.TOTP,
                    totpSecretEnc: secret, // In production, encrypt this!
                    enabledAt: new Date(),
                },
                create: {
                    userId,
                    enabled: true,
                    method: TwoFactorMethod.TOTP,
                    totpSecretEnc: secret,
                    enabledAt: new Date(),
                },
            });
        } else if (method === TwoFactorMethod.EMAIL) {
            if (!user.emailVerified) {
                throw new BadRequestException('Email must be verified to enable Email 2FA');
            }

            await this.prisma.twoFactor.upsert({
                where: { userId },
                update: {
                    enabled: true,
                    method: TwoFactorMethod.EMAIL,
                    enabledAt: new Date(),
                },
                create: {
                    userId,
                    enabled: true,
                    method: TwoFactorMethod.EMAIL,
                    enabledAt: new Date(),
                },
            });
        }

        return { success: true, message: 'Two-factor authentication enabled' };
    }

    /**
     * Disable 2FA
     */
    async disable(userId: string, code: string) {
        const twoFactor = await this.prisma.twoFactor.findUnique({ where: { userId } });
        if (!twoFactor || !twoFactor.enabled) {
            throw new BadRequestException('2FA is not enabled');
        }

        // Verify code before disabling
        let isValid = false;
        if (twoFactor.method === TwoFactorMethod.TOTP) {
            const result = await verify({ token: code, secret: twoFactor.totpSecretEnc });
            isValid = result.valid;
        } else if (twoFactor.method === TwoFactorMethod.EMAIL) {
            const result = await this.otpService.verify(userId, code, OtpPurpose.LOGIN);
            isValid = result.valid;
        }

        if (!isValid) {
            throw new UnauthorizedException('Invalid code');
        }

        await this.prisma.twoFactor.update({
            where: { userId },
            data: { enabled: false, totpSecretEnc: null, enabledAt: null },
        });

        return { success: true, message: 'Two-factor authentication disabled' };
    }
}
