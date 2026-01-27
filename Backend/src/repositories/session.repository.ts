import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionStatus } from '@prisma/client';

@Injectable()
export class SessionRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        userId: string;
        refreshTokenHash: string;
        refreshExpiresAt: Date;
        ip?: string;
        userAgent?: string;
        deviceName?: string;
        deviceId?: string;
    }) {
        return this.prisma.session.create({
            data: {
                ...data,
                status: SessionStatus.ACTIVE,
                lastSeenAt: new Date(),
            },
        });
    }

    async findByRefreshToken(refreshTokenHash: string) {
        return this.prisma.session.findUnique({
            where: { refreshTokenHash },
            include: { user: true },
        });
    }

    async findActiveByUser(userId: string) {
        return this.prisma.session.findMany({
            where: {
                userId,
                status: SessionStatus.ACTIVE,
            },
            orderBy: {
                lastSeenAt: 'desc',
            },
        });
    }

    async revoke(id: string, reason?: string) {
        return this.prisma.session.update({
            where: { id },
            data: {
                status: SessionStatus.REVOKED,
                revokedAt: new Date(),
                revokeReason: reason,
            },
        });
    }

    async revokeAll(userId: string, reason?: string) {
        return this.prisma.session.updateMany({
            where: {
                userId,
                status: SessionStatus.ACTIVE,
            },
            data: {
                status: SessionStatus.REVOKED,
                revokedAt: new Date(),
                revokeReason: reason,
            },
        });
    }

    async deleteExpired() {
        return this.prisma.session.deleteMany({
            where: {
                refreshExpiresAt: {
                    lt: new Date(),
                },
            },
        });
    }
}
