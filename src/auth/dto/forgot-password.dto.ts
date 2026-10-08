import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'student@example.com',
    description: 'Email address of the account requesting a password reset',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
