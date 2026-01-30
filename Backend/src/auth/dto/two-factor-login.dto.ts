import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorLoginDto {
    @ApiProperty({
        example: '123456',
        description: '6-digit OTP code',
    })
    @IsString()
    @IsNotEmpty({ message: 'Code is required' })
    @Length(6, 6, { message: 'Code must be 6 digits' })
    code: string;

    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Temporary token received from the initial login step',
    })
    @IsString()
    @IsNotEmpty({ message: 'Temporary token is required' })
    tempToken: string;
}
