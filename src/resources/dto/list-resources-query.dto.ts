import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListResourcesQueryDto {
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
    enum: ['alphabetical', 'newest', 'most-downloaded', 'top-rated'],
    example: 'newest',
    description: 'Sort order (default newest)',
  })
  sort?: 'alphabetical' | 'newest' | 'most-downloaded' | 'top-rated';

  @ApiPropertyOptional({
    example: 'algorithms',
    description: 'Search resource title or description',
  })
  search?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filter by course ID',
  })
  courseId?: string;

  @ApiPropertyOptional({
    example: 'pdf',
    description: 'Filter by file type',
  })
  fileType?: string;

  @ApiPropertyOptional({
    enum: ['all', 'bookmarked', 'my-uploads'],
    example: 'all',
    description:
      'Filter resources by all, bookmarked, or uploaded by the caller',
  })
  filter?: 'all' | 'bookmarked' | 'my-uploads';

  @ApiPropertyOptional({
    enum: ['all', 'pending', 'approved', 'rejected'],
    example: 'all',
    default: 'all',
    description: 'Filter resources by approval status',
  })
  status?: 'all' | 'pending' | 'approved' | 'rejected';
}
