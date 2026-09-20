import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ maxLength: 100 })
  firstName?: string;

  @ApiPropertyOptional({ maxLength: 100, nullable: true })
  middleName?: string | null;

  @ApiPropertyOptional({ maxLength: 100 })
  lastName?: string;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  profilePhotoUrl?: string | null;
}
