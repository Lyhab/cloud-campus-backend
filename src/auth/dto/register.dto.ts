import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
  })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiPropertyOptional({
    example: 'Michael',
    description: 'Middle name of the user',
  })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({
    example: 'Smith',
    description: 'Last name of the user',
  })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({
    example: 'john.smith@example.com',
    description: 'Email address used to sign in',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Password for the user account',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
