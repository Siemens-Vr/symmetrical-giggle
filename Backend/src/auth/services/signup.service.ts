import {
    Injectable,
    ConflictException,
    BadRequestException,
    UnauthorizedException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from '../../repositories/user.repository';
import { OtpRepository } from '../../repositories/otp.repository';
import { SessionRepository } from '../../repositories/session.repository';
import { OrganizationRepository } from '../../repositories/organization.repository';
import { OrganizationMemberRepository } from '../../repositories/organization-member.repository';
import { OrganizationVerificationRepository } from '../../repositories/organization-verification.repository';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { hashPassword, validatePasswordStrength } from '../../common/utils/password.util';
import { isAgeValid } from '../../common/utils/age.util';
import { validateSlugFormat } from '../../common/utils/slug.util';
import { OtpPurpose, OrgRole } from '@prisma/client';

@Injectable()
export class SignupService {
    constructor(
        private prisma: PrismaService,
        private userRepository: UserRepository,
        private otpRepository: OtpRepository,
        private sessionRepository: SessionRepository,
        private organizationRepository: OrganizationRepository,
        private organizationMemberRepository: OrganizationMemberRepository,
        private organizationVerificationRepository: OrganizationVerificationRepository,
        private otpService: OtpService,
        private tokenService: TokenService,
        @InjectQueue('email') private emailQueue: Queue,
    ) { }

    /**
     * Step 1: Initiate signup with email
     */
    async initiateSignup(email: string, ip?: string, userAgent?: string) {
        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(email);

        // If user exists, is verified, AND has a password, it's a conflict
        if (existingUser && existingUser.emailVerified && existingUser.passwordHash) {
            throw new ConflictException({
                success: false,
                error: 'EMAIL_ALREADY_EXISTS',
                message: 'This email is already registered. Please log in or use password reset.',
            });
        }

        let user = existingUser;

        // Create user if doesn't exist
        if (!user) {
            user = await this.userRepository.create({
                email,
                passwordHash: '', // Will be set later
            });
        }

        // Email-based rate limiting: Max 5 emails per hour per address
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const recentOtpsCount = await this.prisma.emailOtp.count({
            where: {
                userId: user.id,
                createdAt: { gte: oneHourAgo },
            },
        });

        if (recentOtpsCount >= 5) {
            throw new BadRequestException({
                success: false,
                error: 'TOO_MANY_REQUESTS',
                message: 'Maximum verification attempts reached for this email. Please try again in an hour.',
            });
        }

        // Generate and store OTP
        const otpCode = await this.otpService.generateAndStore(
            user.id,
            OtpPurpose.VERIFY_EMAIL,
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
            message: 'Verification code sent to your email',
            expiresIn: 600,
        };
    }

    /**
     * Step 2: Verify OTP
     */
    async verifyOtp(email: string, code: string) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new BadRequestException({
                success: false,
                error: 'USER_NOT_FOUND',
                message: 'User not found',
            });
        }

        const result = await this.otpService.verify(user.id, code, OtpPurpose.VERIFY_EMAIL);

        if (!result.valid) {
            if (result.error === 'OTP_EXPIRED') {
                throw new BadRequestException({
                    success: false,
                    error: 'OTP_EXPIRED',
                    message: 'Verification code has expired. Please request a new one.',
                });
            }

            if (result.error === 'MAX_ATTEMPTS_EXCEEDED') {
                throw new BadRequestException({
                    success: false,
                    error: 'MAX_ATTEMPTS_EXCEEDED',
                    message: 'Too many failed attempts. Please request a new code.',
                });
            }

            if (result.error === 'OTP_ALREADY_USED') {
                throw new BadRequestException({
                    success: false,
                    error: 'OTP_ALREADY_USED',
                    message: 'This code has already been used. Please request a new one.',
                });
            }

            throw new BadRequestException({
                success: false,
                error: 'INVALID_OTP',
                message: 'Invalid verification code. Please try again.',
                attemptsRemaining: result.attemptsRemaining,
            });
        }

        // Mark email as verified
        await this.userRepository.setEmailVerified(user.id);

        // Generate temp token for next steps
        const tempToken = this.tokenService.generateTempToken(user.id, user.email, 'set-password');

        return {
            success: true,
            message: 'Email verified successfully',
            tempToken,
        };
    }

    /**
     * Step 3: Resend OTP
     */
    async resendOtp(email: string, ip?: string, userAgent?: string) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new BadRequestException({
                success: false,
                error: 'USER_NOT_FOUND',
                message: 'User not found',
            });
        }

        // Generate new OTP
        const otpCode = await this.otpService.generateAndStore(
            user.id,
            OtpPurpose.VERIFY_EMAIL,
            ip,
            userAgent,
        );

        // Queue email job
        await this.emailQueue.add('send-otp', {
            email: user.email,
            code: otpCode,
            expiresIn: 600,
        });

        return {
            success: true,
            message: 'New verification code sent',
            expiresIn: 600,
        };
    }

    /**
     * Step 4: Set password
     */
    async setPassword(userId: string, password: string) {
        // Validate password strength
        if (!validatePasswordStrength(password)) {
            throw new BadRequestException({
                success: false,
                error: 'WEAK_PASSWORD',
                message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
            });
        }

        const passwordHash = await hashPassword(password);
        await this.userRepository.setPassword(userId, passwordHash);

        // Generate token for next step
        const user = await this.userRepository.findById(userId);
        const tempToken = this.tokenService.generateTempToken(userId, user.email, 'complete-profile');

        return {
            success: true,
            message: 'Password set successfully',
            tempToken,
        };
    }

    /**
     * Step 5a: Complete individual signup
     */
    async completeIndividual(
        userId: string,
        data: {
            firstName: string;
            lastName: string;
            dateOfBirth: string;
            country: string;
            termsAccepted?: boolean;
            tosVersion?: string;
        },
        ip?: string,
        userAgent?: string,
    ) {
        // Validate age
        const dob = new Date(data.dateOfBirth);
        if (!isAgeValid(dob, 13)) {
            throw new BadRequestException({
                success: false,
                error: 'AGE_RESTRICTION',
                message: 'You must be at least 13 years old to create an account',
            });
        }

        // Update user profile
        const user = await this.userRepository.updateProfile(userId, {
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: dob,
            country: data.country,
            termsAccepted: data.termsAccepted,
            tosVersion: '1.0', // Hardcoded for now, or pass from FE
        });

        // Create session and tokens
        const { accessToken, refreshToken, expiresIn } = await this.createSession(
            user.id,
            user.email,
            ip,
            userAgent,
        );

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                emailVerified: user.emailVerified,
            },
            accessToken,
            refreshToken,
            expiresIn,
        };
    }

    /**
     * Step 5b: Complete organization signup
     */
    async completeOrganization(
        userId: string,
        data: {
            organizationName: string;
            slug: string;
            type: any;
            country: string;
            websiteUrl?: string;
            termsAccepted: boolean;
        },
        ip?: string,
        userAgent?: string,
    ) {
        // Validate slug format
        if (!validateSlugFormat(data.slug)) {
            throw new BadRequestException({
                success: false,
                error: 'INVALID_SLUG_FORMAT',
                message: 'Slug can only contain lowercase letters, numbers, and hyphens',
            });
        }

        // Check slug availability
        const isAvailable = await this.organizationRepository.checkSlugAvailability(data.slug);
        if (!isAvailable) {
            const suggestion = await this.organizationRepository.suggestSlug(data.slug);
            throw new ConflictException({
                success: false,
                error: 'SLUG_ALREADY_EXISTS',
                message: 'This organization slug is already taken',
                suggestion,
            });
        }

        // Transaction: Create Org + Member + Update User
        const { organization, user } = await this.prisma.$transaction(async (tx) => {
            // Create organization
            const org = await this.organizationRepository.create({
                slug: data.slug,
                name: data.organizationName,
                type: data.type,
                country: data.country,
                websiteUrl: data.websiteUrl,
            }, tx);

            // Add user as owner
            await this.organizationMemberRepository.create(org.id, userId, OrgRole.OWNER, tx);

            // Update user terms
            const u = await this.userRepository.updateProfile(userId, {
                termsAccepted: data.termsAccepted,
                tosVersion: '1.0',
            }, tx);

            return { organization: org, user: u };
        });

        // Create session and tokens
        const { accessToken, refreshToken, expiresIn } = await this.createSession(
            user.id,
            user.email,
            ip,
            userAgent,
        );

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified,
            },
            organization: {
                id: organization.id,
                slug: organization.slug,
                name: organization.name,
                type: organization.type,
                status: organization.status,
            },
            accessToken,
            refreshToken,
            expiresIn,
        };
    }

    /**
     * Check slug availability
     */
    async checkSlugAvailability(slug: string) {
        const isAvailable = await this.organizationRepository.checkSlugAvailability(slug);

        if (isAvailable) {
            return {
                available: true,
                slug,
            };
        }

        const suggestion = await this.organizationRepository.suggestSlug(slug);
        return {
            available: false,
            slug,
            suggestion,
        };
    }

    /**
     * Create session and generate tokens
     */
    private async createSession(
        userId: string,
        email: string,
        ip?: string,
        userAgent?: string,
    ) {
        // Generate tokens
        const accessToken = this.tokenService.generateAccessToken(userId, email);
        const { token: refreshToken, hash: refreshTokenHash, expiresAt } =
            this.tokenService.generateRefreshTokenPair();

        // Parse device name from user agent (simplified)
        const deviceName = userAgent ? this.parseDeviceName(userAgent) : undefined;

        // Create session
        await this.sessionRepository.create({
            userId,
            refreshTokenHash,
            refreshExpiresAt: expiresAt,
            ip,
            userAgent,
            deviceName,
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: 900, // 15 minutes in seconds
        };
    }

    /**
     * Parse device name from user agent (simplified)
     */
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
