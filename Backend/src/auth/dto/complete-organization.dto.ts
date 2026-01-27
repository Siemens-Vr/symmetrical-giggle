import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUrl, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrgType } from '@prisma/client';

export class CompleteOrganizationDto {
    @ApiProperty({
        example: 'Acme Corp',
        description: 'Organization name',
    })
    @IsString()
    @IsNotEmpty({ message: 'Organization name is required' })
    @Length(2, 100, { message: 'Organization name must be between 2 and 100 characters' })
    organizationName: string;

    @ApiProperty({
        example: 'acme-corp',
        description: 'Organization slug (URL-friendly identifier)',
    })
    @IsString()
    @IsNotEmpty({ message: 'Organization slug is required' })
    @Length(3, 50, { message: 'Slug must be between 3 and 50 characters' })
    @Matches(/^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])?$/, {
        message: 'Slug can only contain lowercase letters, numbers, and hyphens',
    })
    slug: string;

    @ApiProperty({
        example: 'COMPANY',
        enum: OrgType,
        description: 'Organization type',
    })
    @IsEnum(OrgType, { message: 'Invalid organization type' })
    @IsNotEmpty({ message: 'Organization type is required' })
    type: OrgType;

    @ApiProperty({
        example: 'US',
        description: 'Country code (ISO 3166-1 alpha-2)',
    })
    @IsString()
    @IsNotEmpty({ message: 'Country is required' })
    @Length(2, 2, { message: 'Country must be a 2-letter code' })
    country: string;

    @ApiProperty({
        example: 'https://acme.com',
        description: 'Organization website URL',
        required: false,
    })
    @IsOptional()
    @IsUrl({}, { message: 'Please provide a valid URL' })
    websiteUrl?: string;
}
