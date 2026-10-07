import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendConfirmationDto {
  @ApiProperty({
    example: 'student@example.com',
    description: 'Email address of the unconfirmed account',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
