import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class NewUsersQueryDto {
  @ApiPropertyOptional({
    enum: ['newest', 'oldest'],
    example: 'newest',
    default: 'newest',
    description: 'Sort order (default newest)',
  })
  @IsOptional()
  @IsIn(['newest', 'oldest'])
  sort?: 'newest' | 'oldest';

  @ApiPropertyOptional({
    example: 5,
    default: 5,
    description: 'Number of new users to return (default 5)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
