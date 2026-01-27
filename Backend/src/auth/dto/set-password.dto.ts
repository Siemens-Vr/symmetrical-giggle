import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPasswordDto {
    @ApiProperty({
        example: 'SecureP@ss123',
        description: 'User password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)',
    })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message:
                'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
        },
    )
    password: string;
}
