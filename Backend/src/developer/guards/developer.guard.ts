import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { DeveloperService } from '../developer.service';

@Injectable()
export class DeveloperGuard implements CanActivate {
    constructor(private developerService: DeveloperService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.id) {
            return false;
        }

        const isDeveloper = await this.developerService.isDeveloper(user.id);

        if (!isDeveloper) {
            throw new ForbiddenException({
                success: false,
                error: 'DEVELOPER_REQUIRED',
                message: 'You must enable developer capability to access this resource',
            });
        }

        return true;
    }
}
