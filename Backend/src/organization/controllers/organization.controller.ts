import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { OrganizationService } from '../services/organization.service';
import { SubmitVerificationDto } from '../dto/submit-verification.dto';
import { TwoFactorGuard } from '../../auth/guards/two-factor.guard';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Assuming this exists or will be added

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationController {
    constructor(private organizationService: OrganizationService) { }

    @Post(':id/verify')
    @UseGuards(TwoFactorGuard) // Add JwtAuthGuard as well once confirmed
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Submit organization for verification' })
    @ApiResponse({ status: 200, description: 'Verification submitted' })
    @ApiResponse({ status: 403, description: '2FA required or not owner' })
    async verify(@Param('id') id: string, @Body() dto: SubmitVerificationDto, @Req() req: any) {
        return this.organizationService.submitVerification(id, req.user.id, dto);
    }
}
