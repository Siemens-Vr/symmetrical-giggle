import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../services/token.service';

@Injectable()
export class TempAuthGuard implements CanActivate {
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
            const payload = this.tokenService.verifyTempToken(token);
            const path = request.path;

            if (payload.type !== 'temp' || !payload.emailVerified) {
                throw new UnauthorizedException({
                    success: false,
                    error: 'INVALID_TOKEN',
                    message: 'Invalid token type',
                });
            }

            // Step validation
            if (path.includes('set-password') && payload.currentStep !== 'set-password') {
                throw new UnauthorizedException({
                    success: false,
                    error: 'INVALID_STEP',
                    message: 'Please verify your email first',
                });
            }

            if ((path.includes('complete-individual') || path.includes('complete-organization')) && payload.currentStep !== 'complete-profile') {
                throw new UnauthorizedException({
                    success: false,
                    error: 'INVALID_STEP',
                    message: 'Please set your password first',
                });
            }

            if (path.includes('reset/complete') && payload.currentStep !== 'reset-password') {
                throw new UnauthorizedException({
                    success: false,
                    error: 'INVALID_STEP',
                    message: 'Please verify your reset code first',
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
