import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrgRole } from '@prisma/client';

@Injectable()
export class OrganizationMemberRepository {
    constructor(private prisma: PrismaService) { }

    async create(orgId: string, userId: string, role: OrgRole = OrgRole.MEMBER) {
        return this.prisma.organizationMember.create({
            data: {
                orgId,
                userId,
                role,
            },
        });
    }

    async findByOrgAndUser(orgId: string, userId: string) {
        return this.prisma.organizationMember.findUnique({
            where: {
                orgId_userId: {
                    orgId,
                    userId,
                },
            },
        });
    }

    async findByUser(userId: string) {
        return this.prisma.organizationMember.findMany({
            where: { userId },
            include: {
                org: true,
            },
        });
    }

    async updateRole(orgId: string, userId: string, role: OrgRole) {
        return this.prisma.organizationMember.update({
            where: {
                orgId_userId: {
                    orgId,
                    userId,
                },
            },
            data: { role },
        });
    }
}
