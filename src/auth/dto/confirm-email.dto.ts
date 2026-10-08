import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class ConfirmEmailDto {
  @ApiProperty({
    example: 'student@example.com',
    description: 'Email address of the account being confirmed',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '123456',
    description: 'Verification code sent to the user by email',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, {
    message: 'Code must be a 6-digit number.',
  })
  code!: string;
}
