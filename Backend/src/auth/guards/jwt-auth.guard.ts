import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../services/token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private tokenService: TokenService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException({
                success: false,
                error: 'INVALID_TOKEN',
                message: 'Invalid or missing authorization token',
            });
        }

        const token = authHeader.substring(7);

        try {
            const payload = this.tokenService.verifyAccessToken(token);

            if (payload.type !== 'access') {
                throw new UnauthorizedException({
                    success: false,
                    error: 'INVALID_TOKEN',
                    message: 'Invalid token type',
                });
            }

            request.user = {
                id: payload.sub,
                email: payload.email,
            };

            return true;
        } catch (error) {
            throw new UnauthorizedException({
                success: false,
                error: 'INVALID_TOKEN',
                message: 'Invalid or expired token',
            });
        }
    }
}
