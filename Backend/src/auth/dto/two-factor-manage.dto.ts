import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TwoFactorMethod } from '@prisma/client';

export class EnableTwoFactorDto {
    @ApiProperty({
        description: '2FA authentication code',
        example: '123456',
    })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({
        description: '2FA Method',
        enum: TwoFactorMethod,
        example: 'TOTP',
    })
    @IsEnum(TwoFactorMethod)
    method: TwoFactorMethod;

    @ApiProperty({
        description: 'TOTP Secret (required for TOTP enabling)',
        required: false,
    })
    @IsOptional()
    @IsString()
    secret?: string;
}

export class DisableTwoFactorDto {
    @ApiProperty({
        description: '2FA authentication code',
        example: '123456',
    })
    @IsString()
    @IsNotEmpty()
    code: string;
}
