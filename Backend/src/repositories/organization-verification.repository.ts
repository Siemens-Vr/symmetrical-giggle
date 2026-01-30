import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrganizationVerificationRepository {
    constructor(private prisma: PrismaService) { }

    async create(orgId: string, data: Partial<Prisma.OrganizationVerificationUncheckedCreateInput> = {}) {
        return this.prisma.organizationVerification.create({
            data: {
                ...data,
                orgId,
                paymentMethodAdded: data.paymentMethodAdded ?? false,
            },
        });
    }

    async findByOrg(orgId: string) {
        return this.prisma.organizationVerification.findUnique({
            where: { orgId },
        });
    }

    async update(
        orgId: string,
        data: {
            contactName?: string;
            contactEmail?: string;
            contactPhone?: string;
            registrationNumber?: string;
            docsNote?: string;
            paymentMethodAdded?: boolean;
        },
    ) {
        return this.prisma.organizationVerification.update({
            where: { orgId },
            data,
        });
    }
}
