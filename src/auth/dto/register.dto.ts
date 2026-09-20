import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
  })
  firstName: string;

  @ApiPropertyOptional({
    example: 'Michael',
    description: 'Middle name of the user',
  })
  middleName?: string;

  @ApiProperty({
    example: 'Smith',
    description: 'Last name of the user',
  })
  lastName: string;

  @ApiProperty({
    example: 'john.smith@example.com',
    description: 'Email address used to sign in',
  })
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Password for the user account',
    format: 'password',
  })
  password: string;
}
