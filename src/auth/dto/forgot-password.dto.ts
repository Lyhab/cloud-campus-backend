import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'student@example.com',
    description: 'Email address of the account requesting a password reset',
  })
  email!: string;
}
