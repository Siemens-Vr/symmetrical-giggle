import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { generateRefreshToken, hashRefreshToken } from '../../common/utils/crypto.util';

export interface AccessTokenPayload {
    sub: string;
    email: string;
    type: 'access';
}

export interface TempTokenPayload {
    sub: string;
    email: string;
    type: 'temp';
    emailVerified: boolean;
}

@Injectable()
export class TokenService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    /**
     * Generate JWT access token (15 min expiry)
     */
    generateAccessToken(userId: string, email: string): string {
        const payload: AccessTokenPayload = {
            sub: userId,
            email,
            type: 'access',
        };

        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRY') || '15m',
        });
    }

    /**
     * Generate JWT temp token for signup flow (15 min expiry)
     */
    generateTempToken(userId: string, email: string): string {
        const payload: TempTokenPayload = {
            sub: userId,
            email,
            type: 'temp',
            emailVerified: true,
        };

        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_TEMP_SECRET'),
            expiresIn: this.configService.get('JWT_TEMP_EXPIRY') || '15m',
        });
    }

    /**
     * Verify and decode temp token
     */
    verifyTempToken(token: string): TempTokenPayload {
        return this.jwtService.verify(token, {
            secret: this.configService.get('JWT_TEMP_SECRET'),
        });
    }

    /**
     * Verify and decode access token
     */
    verifyAccessToken(token: string): AccessTokenPayload {
        return this.jwtService.verify(token, {
            secret: this.configService.get('JWT_ACCESS_SECRET'),
        });
    }

    /**
     * Generate refresh token and its hash
     */
    generateRefreshTokenPair(): { token: string; hash: string; expiresAt: Date } {
        const token = generateRefreshToken();
        const hash = hashRefreshToken(token);

        const expiryDays = 30;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);

        return { token, hash, expiresAt };
    }
}
