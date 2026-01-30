import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrgType, OrgStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { suggestAlternativeSlug } from '../common/utils/slug.util';

@Injectable()
export class OrganizationRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        slug: string;
        name: string;
        type: OrgType;
        country?: string;
        websiteUrl?: string;
    }, tx?: Prisma.TransactionClient) {
        const client = tx || this.prisma;
        return client.organization.create({
            data: {
                ...data,
                status: OrgStatus.UNVERIFIED,
            },
        });
    }

    async findBySlug(slug: string) {
        return this.prisma.organization.findUnique({
            where: { slug },
        });
    }

    async findById(id: string) {
        return this.prisma.organization.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: true,
                    },
                },
                verification: true,
            },
        });
    }

    async checkSlugAvailability(slug: string): Promise<boolean> {
        const existing = await this.findBySlug(slug);
        return !existing;
    }

    async suggestSlug(baseSlug: string): Promise<string> {
        let counter = 2;
        let suggestion = suggestAlternativeSlug(baseSlug, counter);

        while (!(await this.checkSlugAvailability(suggestion))) {
            counter++;
            suggestion = suggestAlternativeSlug(baseSlug, counter);

            // Prevent infinite loop
            if (counter > 100) {
                suggestion = `${baseSlug}-${Date.now()}`;
                break;
            }
        }

        return suggestion;
    }
}
