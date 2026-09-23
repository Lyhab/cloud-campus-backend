import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListCourseStudentsQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (default 1)' })
  page?: string;

  @ApiPropertyOptional({
    example: 20,
    description: 'Page size (default 20, max 100)',
  })
  limit?: string;

  @ApiPropertyOptional({
    enum: ['alphabetical', 'newest', 'oldest'],
    example: 'alphabetical',
    description: 'Sort by student name or enrollment date (default alphabetical)',
  })
  sort?: string;

  @ApiPropertyOptional({
    example: 'smith',
    description: 'Search student name or email',
  })
  search?: string;
}
