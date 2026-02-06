import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DeveloperRepository } from '../repositories/developer.repository';
import { UserRepository } from '../repositories/user.repository';
import { OrganizationMemberRepository } from '../repositories/organization-member.repository';
import { EnableDeveloperDto } from './dto/enable-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';
import { OrgRole, OrgStatus } from '@prisma/client';

@Injectable()
export class DeveloperService {
    constructor(
        private developerRepository: DeveloperRepository,
        private userRepository: UserRepository,
        private organizationMemberRepository: OrganizationMemberRepository,
    ) { }

    /**
     * Enable developer capability for a user
     * Idempotent: returns existing profile if already enabled
     */
    async enableDeveloper(
        userId: string,
        dto: EnableDeveloperDto,
        ip?: string,
        userAgent?: string
    ) {
        // Enforce 1:1 relationship via upsert
        const profile = await this.developerRepository.upsert(userId, {
            displayName: dto.displayName,
            websiteUrl: dto.websiteUrl,
            bio: dto.bio,
        });

        // Audit log
        await this.developerRepository.createAuditLog({
            userId,
            action: 'DEVELOPER_ENABLED',
            ip,
            userAgent,
            metadata: { profileId: profile.id },
        });

        return profile;
    }

    /**
     * Get developer profile
     */
    async getProfile(userId: string) {
        return this.developerRepository.findByUserId(userId);
    }

    /**
     * Update developer profile
     */
    async updateProfile(userId: string, dto: UpdateDeveloperDto) {
        const profile = await this.developerRepository.findByUserId(userId);
        if (!profile) {
            throw new NotFoundException('Developer profile not found');
        }

        return this.developerRepository.update(userId, dto);
    }

    /**
     * Check if user is a developer (helper)
     */
    async isDeveloper(userId: string): Promise<boolean> {
        const profile = await this.developerRepository.findByUserId(userId);
        return !!profile;
    }

    /**
     * Get organizations where the user can publish apps
     * Rules:
     * 1. User must be a member
     * 2. User role must be OWNER or ADMIN
     * 3. Organization must be VERIFIED
     */
    async getPublishableOrgs(userId: string) {
        // Ensure user is a developer first
        const isDev = await this.isDeveloper(userId);
        if (!isDev) {
            return [];
        }

        const memberships = await this.organizationMemberRepository.findByUser(userId);

        return memberships.map(member => {
            const org = member.org;
            const hasRole = member.role === OrgRole.OWNER || member.role === OrgRole.ADMIN;
            const isVerified = org.status === OrgStatus.VERIFIED;

            return {
                orgId: org.id,
                name: org.name,
                slug: org.slug,
                role: member.role,
                isVerified: isVerified,
                canPublish: hasRole && isVerified,
                reasons: {
                    role: hasRole ? 'OK' : 'Insufficient role (requires ADMIN or OWNER)',
                    verification: isVerified ? 'OK' : 'Organization not verified',
                }
            };
        });
    }
}
