import { Module } from '@nestjs/common';
import { DeveloperService } from './developer.service';
import { DeveloperController } from './developer.controller';
import { DeveloperRepository } from '../repositories/developer.repository';
import { DeveloperGuard } from './guards/developer.guard';
import { PrismaService } from '../prisma/prisma.service'; // Assuming global or needs import
import { UserRepository } from '../repositories/user.repository';
import { OrganizationMemberRepository } from '../repositories/organization-member.repository';
import { AuthModule } from '../auth/auth.module'; // Likely needed if using Auth parts, though guards might key off logic

@Module({
    imports: [AuthModule],
    controllers: [DeveloperController],
    providers: [
        DeveloperService,
        DeveloperRepository,
        DeveloperGuard,
        UserRepository, // Re-providing repositories if not exported by a RepositoryModule
        OrganizationMemberRepository,
        PrismaService, // Usually global, but just in case
    ],
    exports: [DeveloperService, DeveloperGuard],
})
export class DeveloperModule { }
