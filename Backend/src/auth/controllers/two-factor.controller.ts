import {
    Controller,
    Post,
    Body,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TwoFactorService } from '../services/two-factor.service';
import { EnableTwoFactorDto, DisableTwoFactorDto } from '../dto/two-factor-manage.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('2FA Management')
@Controller('auth/2fa')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TwoFactorController {
    constructor(private readonly twoFactorService: TwoFactorService) { }

    @Post('generate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Generate TOTP secret and QR code URL' })
    async generate(@Req() req: any) {
        return this.twoFactorService.generateSecret(req.user.id);
    }

    @Post('enable')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Enable 2FA' })
    async enable(@Req() req: any, @Body() dto: EnableTwoFactorDto) {
        return this.twoFactorService.enable(req.user.id, dto.code, dto.method, dto.secret);
    }

    @Post('disable')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Disable 2FA' })
    async disable(@Req() req: any, @Body() dto: DisableTwoFactorDto) {
        return this.twoFactorService.disable(req.user.id, dto.code);
    }
}
