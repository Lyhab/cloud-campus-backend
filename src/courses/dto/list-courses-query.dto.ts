import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListCoursesQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (default 1)' })
  page?: string;

  @ApiPropertyOptional({
    example: 20,
    description: 'Page size (default 20, max 100)',
  })
  limit?: string;

  @ApiPropertyOptional({
    enum: ['alphabetical', 'newest', 'oldest'],
    example: 'newest',
    description: 'Sort order (default newest)',
  })
  sort?: string;

  @ApiPropertyOptional({
    example: 'computer',
    description: 'Search course name, code, or description',
  })
  search?: string;

  @ApiPropertyOptional({
    example: 'COMP101',
    description: 'Filter by course code (partial, case-insensitive)',
  })
  code?: string;

  @ApiPropertyOptional({
    enum: ['my-courses'],
    example: 'my-courses',
    description: 'Set to my-courses to only return courses the caller is enrolled in',
  })
  filter?: string;
}
