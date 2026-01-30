import { IsNotEmpty, IsString, IsDateString, Length, IsBoolean, Equals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteIndividualDto {
    @ApiProperty({
        example: 'John',
        description: 'First name',
    })
    @IsString()
    @IsNotEmpty({ message: 'First name is required' })
    @Length(1, 50, { message: 'First name must be between 1 and 50 characters' })
    firstName: string;

    @ApiProperty({
        example: 'Doe',
        description: 'Last name',
    })
    @IsString()
    @IsNotEmpty({ message: 'Last name is required' })
    @Length(1, 50, { message: 'Last name must be between 1 and 50 characters' })
    lastName: string;

    @ApiProperty({
        example: '1990-05-15',
        description: 'Date of birth (YYYY-MM-DD)',
    })
    @IsDateString({}, { message: 'Please provide a valid date of birth' })
    @IsNotEmpty({ message: 'Date of birth is required' })
    dateOfBirth: string;

    @ApiProperty({
        example: 'US',
        description: 'Country code (ISO 3166-1 alpha-2)',
    })
    @IsString()
    @IsNotEmpty({ message: 'Country is required' })
    @Length(2, 2, { message: 'Country must be a 2-letter code' })
    country: string;
    @ApiProperty({
        example: true,
        description: 'Accept Terms of Service',
    })
    @IsBoolean()
    @Equals(true, { message: 'You must accept the terms of service' })
    termsAccepted: boolean;
}
