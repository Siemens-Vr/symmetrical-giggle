import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyResetCodeDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'User email address',
    })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({
        example: '123456',
        description: '6-digit OTP code',
    })
    @IsString()
    @IsNotEmpty({ message: 'Code is required' })
    @Length(6, 6, { message: 'Code must be 6 digits' })
    code: string;
}
