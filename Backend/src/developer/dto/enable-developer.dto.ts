import { IsString, IsNotEmpty, IsOptional, IsUrl, MaxLength, MinLength } from 'class-validator';

export class EnableDeveloperDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    displayName: string;

    @IsOptional()
    @IsString()
    @IsUrl()
    @MaxLength(255)
    websiteUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    bio?: string;
}
