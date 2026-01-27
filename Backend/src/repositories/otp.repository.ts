import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OtpPurpose } from '@prisma/client';

@Injectable()
export class OtpRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        userId: string;
        purpose: OtpPurpose;
        codeHash: string;
        expiresAt: Date;
        ip?: string;
        userAgent?: string;
    }) {
        return this.prisma.emailOtp.create({
            data,
        });
    }

    async findLatestUnused(userId: string, purpose: OtpPurpose) {
        return this.prisma.emailOtp.findFirst({
            where: {
                userId,
                purpose,
                usedAt: null,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async incrementAttempts(id: string) {
        return this.prisma.emailOtp.update({
            where: { id },
            data: {
                attempts: { increment: 1 },
                lastTriedAt: new Date(),
            },
        });
    }

    async markAsUsed(id: string) {
        return this.prisma.emailOtp.update({
            where: { id },
            data: {
                usedAt: new Date(),
            },
        });
    }

    async deleteExpired() {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        return this.prisma.emailOtp.deleteMany({
            where: {
                expiresAt: {
                    lt: oneDayAgo,
                },
            },
        });
    }
}
