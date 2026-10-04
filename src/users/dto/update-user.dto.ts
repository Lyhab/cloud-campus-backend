import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User first name',
    maxLength: 100,
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User middle name',
    maxLength: 100,
    nullable: true,
    example: 'Michael',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string | null;

  @ApiPropertyOptional({
    description: 'User last name',
    maxLength: 100,
    example: 'Smith',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'URL of the user profile photo',
    maxLength: 500,
    nullable: true,
    example: 'https://example.com/profile.jpg',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  profilePhotoUrl?: string | null;
}
