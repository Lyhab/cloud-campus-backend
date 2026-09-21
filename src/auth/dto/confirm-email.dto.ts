import { ApiProperty } from '@nestjs/swagger';

export class ConfirmEmailDto {
  @ApiProperty({
    example: 'student@example.com',
    description: 'Email address of the account being confirmed',
  })
  email!: string;

  @ApiProperty({
    example: '123456',
    description: 'Verification code sent to the user by email',
  })
  code!: string;
}
