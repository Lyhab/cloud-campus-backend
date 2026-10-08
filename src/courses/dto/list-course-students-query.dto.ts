import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListCourseStudentsQueryDto {
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
    description:
      'Sort by student name or enrollment date (default alphabetical)',
  })
  @IsOptional()
  @IsIn(['alphabetical', 'newest', 'oldest'])
  sort?: 'alphabetical' | 'newest' | 'oldest';

  @ApiPropertyOptional({
    example: 'smith',
    description: 'Search student name or email',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
