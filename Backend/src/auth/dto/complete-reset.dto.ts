import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteResetDto {
    @ApiProperty({
        example: 'NewStrongPassword123!',
        description: 'New password for the account',
    })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    newPassword: string;
}
