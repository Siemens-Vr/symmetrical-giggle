import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TwoFactorGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.id) {
            throw new UnauthorizedException({
                success: false,
                message: 'Authentication required',
            });
        }

        const dbUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            include: { twoFactor: true },
        });

        if (!dbUser || !dbUser.twoFactor || !dbUser.twoFactor.enabled) {
            throw new ForbiddenException({
                success: false,
                error: 'TWO_FACTOR_REQUIRED',
                message: 'Two-factor authentication must be enabled to perform this action',
            });
        }

        return true;
    }
}
