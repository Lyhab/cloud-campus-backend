import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PendingReportsQueryDto {
  @ApiPropertyOptional({
    enum: ['newest', 'oldest'],
    example: 'oldest',
    default: 'oldest',
    description: 'Sort order (default oldest)',
  })
  @IsOptional()
  @IsIn(['newest', 'oldest'])
  sort?: 'newest' | 'oldest';

  @ApiPropertyOptional({
    enum: ['pending', 'dismissed', 'resolved'],
    example: 'pending',
    default: 'pending',
    description: 'Filter reports by status',
  })
  @IsOptional()
  @IsIn(['pending', 'dismissed', 'resolved'])
  status?: 'pending' | 'dismissed' | 'resolved';

  @ApiPropertyOptional({
    example: 5,
    default: 5,
    description: 'Number of reports to return (default 5)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
