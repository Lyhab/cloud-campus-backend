import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListCoursesQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (default 1)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Page size (default 20, max 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    enum: ['alphabetical', 'newest', 'oldest'],
    example: 'alphabetical',
    description: 'Sort order (default alphabetical)',
  })
  @IsOptional()
  @IsIn(['alphabetical', 'newest', 'oldest'])
  sort?: 'alphabetical' | 'newest' | 'oldest';

  @ApiPropertyOptional({
    example: 'computer',
    description: 'Search course name, code, or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'COMP101',
    description: 'Filter by course code (partial, case-insensitive)',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    enum: ['my-courses'],
    example: 'my-courses',
    description:
      'Set to my-courses to only return courses the caller is enrolled in',
  })
  @IsOptional()
  @IsIn(['my-courses'])
  filter?: 'my-courses';
}
