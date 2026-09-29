import { ApiPropertyOptional } from '@nestjs/swagger';

export class RecentResourcesQueryDto {
  @ApiPropertyOptional({
    enum: ['newest', 'oldest'],
    example: 'newest',
    default: 'newest',
    description: 'Sort order (default newest)',
  })
  sort?: 'newest' | 'oldest';

  @ApiPropertyOptional({
    example: 5,
    default: 5,
    description: 'Number of recent resources to return (default 5)',
  })
  limit?: string;
}
