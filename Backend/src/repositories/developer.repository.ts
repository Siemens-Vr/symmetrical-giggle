import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DeveloperRepository {
    constructor(private prisma: PrismaService) { }

    async findByUserId(userId: string) {
        return this.prisma.developerProfile.findUnique({
            where: { userId },
        });
    }

    async upsert(
        userId: string,
        data: {
            displayName: string;
            websiteUrl?: string;
            bio?: string;
        },
    ) {
        return this.prisma.developerProfile.upsert({
            where: { userId },
            update: data,
            create: {
                userId,
                ...data,
            },
        });
    }

    async update(
        userId: string,
        data: {
            displayName?: string;
            websiteUrl?: string;
            bio?: string;
        },
    ) {
        return this.prisma.developerProfile.update({
            where: { userId },
            data,
        });
    }

    async createAuditLog(data: {
        userId: string;
        action: string;
        ip?: string;
        userAgent?: string;
        metadata?: any;
    }) {
        return this.prisma.auditLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                ip: data.ip,
                userAgent: data.userAgent,
                metadata: data.metadata ?? Prisma.JsonNull,
            },
        });
    }
}
