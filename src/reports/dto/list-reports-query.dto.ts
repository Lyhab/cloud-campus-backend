import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListReportsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (default 1)',
  })
  page?: string;

  @ApiPropertyOptional({
    example: 20,
    description: 'Page size (default 20, max 100)',
  })
  limit?: string;

  @ApiPropertyOptional({
    enum: ['newest', 'oldest'],
    example: 'newest',
    default: 'newest',
    description: 'Sort order (default newest)',
  })
  sort?: 'newest' | 'oldest';

  @ApiPropertyOptional({
    example: 'copyright',
    description: 'Search resource title, reporter name or email, or reason',
  })
  search?: string;

  @ApiPropertyOptional({
    enum: ['all', 'pending', 'dismissed', 'resolved'],
    example: 'all',
    default: 'all',
    description: 'Filter reports by status',
  })
  status?: 'all' | 'pending' | 'dismissed' | 'resolved';
}
