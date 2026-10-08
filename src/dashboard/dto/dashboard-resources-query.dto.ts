import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardResourcesQueryDto {
  @ApiPropertyOptional({
    enum: ['rating', 'downloads', 'newest'],
    example: 'rating',
    default: 'rating',
    description: 'Sort order (default rating)',
  })
  @IsOptional()
  @IsIn(['rating', 'downloads', 'newest'])
  sort?: 'rating' | 'downloads' | 'newest';

  @ApiPropertyOptional({
    example: 5,
    default: 5,
    description: 'Minimum number of ratings required',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minRatingCount?: number;

  @ApiPropertyOptional({
    example: 3,
    default: 3,
    description: 'Number of resources to return (default 3)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
