import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardResourcesQueryDto {
  @ApiPropertyOptional({
    enum: ['rating', 'downloads', 'newest'],
    example: 'rating',
    default: 'rating',
    description: 'Sort order (default rating)',
  })
  sort?: 'rating' | 'downloads' | 'newest';

  @ApiPropertyOptional({
    example: 5,
    default: 5,
    description: 'Minimum number of ratings required',
  })
  minRatingCount?: string;

  @ApiPropertyOptional({
    example: 3,
    default: 3,
    description: 'Number of resources to return (default 3)',
  })
  limit?: string;
}
