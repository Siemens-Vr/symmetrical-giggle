import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
    const min = 100000;
    const max = 999999;
    return crypto.randomInt(min, max + 1).toString();
}

/**
 * Hash OTP code using bcrypt
 */
export async function hashOTP(code: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(code, saltRounds);
}

/**
 * Compare OTP code with hash
 */
export async function compareOTP(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
}

/**
 * Generate a random refresh token (32 bytes)
 */
export function generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash refresh token using SHA-256
 */
export function hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}
