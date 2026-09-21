import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User first name',
    maxLength: 100,
    example: 'John',
  })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User middle name',
    maxLength: 100,
    nullable: true,
    example: 'Michael',
  })
  middleName?: string | null;

  @ApiPropertyOptional({
    description: 'User last name',
    maxLength: 100,
    example: 'Smith',
  })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'URL of the user profile photo',
    maxLength: 500,
    nullable: true,
    example: 'https://example.com/profile.jpg',
  })
  profilePhotoUrl?: string | null;
}
