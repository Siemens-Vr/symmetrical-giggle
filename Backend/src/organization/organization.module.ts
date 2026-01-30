import { Module } from '@nestjs/common';
import { OrganizationController } from './controllers/organization.controller';
import { OrganizationService } from './services/organization.service';
import { OrganizationRepository } from '../repositories/organization.repository';
import { OrganizationMemberRepository } from '../repositories/organization-member.repository';
import { OrganizationVerificationRepository } from '../repositories/organization-verification.repository';

@Module({
    controllers: [OrganizationController],
    providers: [
        OrganizationService,
        OrganizationRepository,
        OrganizationMemberRepository,
        OrganizationVerificationRepository,
    ],
})
export class OrganizationModule { }
