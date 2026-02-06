import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { DeveloperService } from './developer.service';
import { EnableDeveloperDto } from './dto/enable-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TwoFactorGuard } from '../auth/guards/two-factor.guard';
import { DeveloperGuard } from './guards/developer.guard';

@Controller('developer')
@UseGuards(JwtAuthGuard)
export class DeveloperController {
    constructor(private readonly developerService: DeveloperService) { }

    @Post('enable')
    @UseGuards(TwoFactorGuard) // Enforce 2FA for enabling developer capability
    @HttpCode(HttpStatus.CREATED)
    async enable(@Request() req, @Body() dto: EnableDeveloperDto) {
        const ip = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.developerService.enableDeveloper(req.user.id, dto, ip, userAgent);
    }

    @Get('me')
    @UseGuards(DeveloperGuard)
    async getProfile(@Request() req) {
        return this.developerService.getProfile(req.user.id);
    }

    @Patch('me')
    @UseGuards(DeveloperGuard)
    async updateProfile(@Request() req, @Body() dto: UpdateDeveloperDto) {
        return this.developerService.updateProfile(req.user.id, dto);
    }

    @Get('orgs')
    @UseGuards(DeveloperGuard)
    async getPublishableOrgs(@Request() req) {
        return this.developerService.getPublishableOrgs(req.user.id);
    }
}
