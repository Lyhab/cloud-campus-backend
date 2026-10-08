import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'student@example.com',
    description: 'Email address of the account requesting a new access token',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'eyJraWQiOiJ...',
    description: 'Refresh token returned during login',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
