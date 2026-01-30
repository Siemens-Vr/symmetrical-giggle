import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from '../../repositories/user.repository';
import { SessionRepository } from '../../repositories/session.repository';
import { TokenService } from './token.service';
import { OtpService } from './otp.service';
import { comparePassword } from '../../common/utils/password.util';
import { LoginDto } from '../dto/login.dto';
import { TwoFactorLoginDto } from '../dto/two-factor-login.dto';
import { verify as verifyTotp } from 'otplib';
import { OtpPurpose, TwoFactorMethod } from '@prisma/client';

@Injectable()
export class LoginService {
    constructor(
        private prisma: PrismaService,
        private userRepository: UserRepository,
        private sessionRepository: SessionRepository,
        private tokenService: TokenService,
        private otpService: OtpService,
        @InjectQueue('email') private emailQueue: Queue,
    ) { }

    /**
     * Step 1: Login with email/password
     */
    async login(dto: LoginDto, ip?: string, userAgent?: string) {
        const user = await this.userRepository.findByEmail(dto.email);

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException({
                success: false,
                error: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password',
            });
        }

        const isPasswordValid = await comparePassword(dto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException({
                success: false,
                error: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password',
            });
        }

        // Check if 2FA is enabled
        const twoFactor = await this.prisma.twoFactor.findUnique({
            where: { userId: user.id },
        });

        if (twoFactor && twoFactor.enabled) {
            // Generate temp token for 2FA step
            const tempToken = this.tokenService.generateTempToken(user.id, user.email, '2fa-login');

            // Handle Email 2FA
            if (twoFactor.method === TwoFactorMethod.EMAIL) {
                // Generate and store OTP
                const otpCode = await this.otpService.generateAndStore(
                    user.id,
                    OtpPurpose.LOGIN,
                    ip,
                    userAgent,
                );

                // Queue email job
                await this.emailQueue.add('send-otp', {
                    email: user.email,
                    code: otpCode,
                    expiresIn: 600, // 10 minutes
                });

                return {
                    success: true,
                    requires2Fa: true,
                    method: 'EMAIL',
                    message: 'Verification code sent to your email',
                    tempToken,
                };
            }

            // Handle TOTP (Authenticator App)
            return {
                success: true,
                requires2Fa: true,
                method: 'TOTP',
                message: 'Two-factor authentication code required',
                tempToken,
            };
        }

        // Standard Login
        return this.createSessionAndResponse(user, ip, userAgent);
    }

    /**
     * Step 2: Verify 2FA code
     */
    async verifyTwoFactor(dto: TwoFactorLoginDto, ip?: string, userAgent?: string) {
        // Verify temp token
        let payload;
        try {
            payload = this.tokenService.verifyTempToken(dto.tempToken);
        } catch (error) {
            throw new UnauthorizedException({
                success: false,
                error: 'INVALID_TOKEN',
                message: 'Invalid or expired temporary token',
            });
        }

        if (payload.type !== 'temp' || payload.currentStep !== '2fa-login') {
            throw new UnauthorizedException({
                success: false,
                error: 'INVALID_TOKEN_TYPE',
                message: 'Invalid token purpose',
            });
        }

        const userId = payload.sub;
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Check 2FA method
        const twoFactor = await this.prisma.twoFactor.findUnique({
            where: { userId: user.id },
        });

        if (!twoFactor || !twoFactor.enabled) {
            throw new BadRequestException({
                success: false,
                error: '2FA_NOT_ENABLED',
                message: 'Two-factor authentication is not enabled for this account',
            });
        }

        // Verify based on method
        let isValid = false;

        if (twoFactor.method === TwoFactorMethod.EMAIL) {
            const result = await this.otpService.verify(user.id, dto.code, OtpPurpose.LOGIN);
            if (result.valid) {
                isValid = true;
            } else {
                if (result.error === 'OTP_EXPIRED') throw new UnauthorizedException('OTP has expired');
                if (result.error === 'MAX_ATTEMPTS_EXCEEDED') throw new UnauthorizedException('Too many attempts');
            }
        } else if (twoFactor.method === TwoFactorMethod.TOTP) {
            if (!twoFactor.totpSecretEnc) {
                throw new BadRequestException('TOTP secret is missing');
            }

            // otplib.verify returns a Promise<VerifyResult>
            const result = await verifyTotp({
                token: dto.code,
                secret: twoFactor.totpSecretEnc,
            });
            isValid = result.valid;
        }

        if (!isValid) {
            throw new UnauthorizedException({
                success: false,
                error: 'INVALID_2FA_CODE',
                message: 'Invalid authentication code',
            });
        }

        return this.createSessionAndResponse(user, ip, userAgent);
    }

    private async createSessionAndResponse(user: any, ip?: string, userAgent?: string) {
        // Create session and tokens
        const accessToken = this.tokenService.generateAccessToken(user.id, user.email);
        const { token: refreshToken, hash: refreshTokenHash, expiresAt } =
            this.tokenService.generateRefreshTokenPair();

        // Parse device name
        const deviceName = userAgent ? this.parseDeviceName(userAgent) : undefined;

        // Create session
        await this.sessionRepository.create({
            userId: user.id,
            refreshTokenHash,
            refreshExpiresAt: expiresAt,
            ip,
            userAgent,
            deviceName,
        });

        return {
            success: true,
            requires2Fa: false,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                emailVerified: user.emailVerified,
            },
            accessToken,
            refreshToken,
            expiresIn: 900, // 15 mins
        };
    }

    private parseDeviceName(userAgent: string): string {
        if (userAgent.includes('Windows')) return 'Windows PC';
        if (userAgent.includes('Mac')) return 'Mac';
        if (userAgent.includes('Linux')) return 'Linux PC';
        if (userAgent.includes('iPhone')) return 'iPhone';
        if (userAgent.includes('iPad')) return 'iPad';
        if (userAgent.includes('Android')) return 'Android Device';
        return 'Unknown Device';
    }
}
