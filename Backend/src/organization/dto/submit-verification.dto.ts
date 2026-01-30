import { IsNotEmpty, IsString, IsEmail, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitVerificationDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    contactName: string;

    @ApiProperty({ example: 'john@acme.com' })
    @IsEmail()
    @IsNotEmpty()
    contactEmail: string;

    @ApiProperty({ example: '+1234567890' })
    @IsString()
    @IsNotEmpty()
    contactPhone: string;

    @ApiProperty({ example: '12345678', required: false })
    @IsString()
    @IsOptional()
    registrationNumber?: string;

    @ApiProperty({ example: 'Registration certificate attached', required: false })
    @IsString()
    @IsOptional()
    docsNote?: string;
}
