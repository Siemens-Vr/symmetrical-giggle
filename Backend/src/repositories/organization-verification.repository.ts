import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationVerificationRepository {
    constructor(private prisma: PrismaService) { }

    async create(orgId: string) {
        return this.prisma.organizationVerification.create({
            data: {
                orgId,
                paymentMethodAdded: false,
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
