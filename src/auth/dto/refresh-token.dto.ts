import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'student@example.com',
    description: 'Email address of the account requesting a new access token',
  })
  email!: string;

  @ApiProperty({
    example: 'eyJraWQiOiJ...',
    description: 'Refresh token returned during login',
  })
  refreshToken!: string;
}
