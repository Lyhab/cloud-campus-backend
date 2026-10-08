import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListReportsQueryDto {
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
    enum: ['newest', 'oldest'],
    example: 'newest',
    default: 'newest',
    description: 'Sort order (default newest)',
  })
  @IsOptional()
  @IsIn(['newest', 'oldest'])
  sort?: 'newest' | 'oldest';

  @ApiPropertyOptional({
    example: 'copyright',
    description: 'Search resource title, reporter name or email, or reason',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['all', 'pending', 'dismissed', 'resolved'],
    example: 'all',
    default: 'all',
    description: 'Filter reports by status',
  })
  @IsOptional()
  @IsIn(['all', 'pending', 'dismissed', 'resolved'])
  status?: 'all' | 'pending' | 'dismissed' | 'resolved';
}
