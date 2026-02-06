import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { SignupController } from './controllers/signup.controller';
import { SignupService } from './services/signup.service';
import { ForgotPasswordController } from './controllers/forgot-password.controller';
import { ForgotPasswordService } from './services/forgot-password.service';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { LoginController } from './controllers/login.controller';
import { LoginService } from './services/login.service';
import { TwoFactorController } from './controllers/two-factor.controller';
import { TwoFactorService } from './services/two-factor.service';
import { TempAuthGuard } from './guards/temp-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserRepository } from '../repositories/user.repository';
import { OtpRepository } from '../repositories/otp.repository';
import { SessionRepository } from '../repositories/session.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { OrganizationMemberRepository } from '../repositories/organization-member.repository';
import { OrganizationVerificationRepository } from '../repositories/organization-verification.repository';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_ACCESS_SECRET'),
                signOptions: {
                    expiresIn: configService.get('JWT_ACCESS_EXPIRY') || '15m',
                },
            }),
        }),
        BullModule.registerQueue({
            name: 'email',
        }),
    ],
    controllers: [SignupController, ForgotPasswordController, LoginController, TwoFactorController],
    providers: [
        SignupService,
        ForgotPasswordService,
        OtpService,
        OtpService,
        TokenService,
        LoginService,
        TwoFactorService,
        TempAuthGuard,
        JwtAuthGuard,
        UserRepository,
        OtpRepository,
        SessionRepository,
        OrganizationRepository,
        OrganizationMemberRepository,
        OrganizationVerificationRepository,
    ],
    exports: [TokenService, JwtAuthGuard],
})
export class AuthModule { }
