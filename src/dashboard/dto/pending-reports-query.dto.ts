import { ApiPropertyOptional } from '@nestjs/swagger';

export class PendingReportsQueryDto {
  @ApiPropertyOptional({
    enum: ['newest', 'oldest'],
    example: 'oldest',
    default: 'oldest',
    description: 'Sort order (default oldest)',
  })
  sort?: 'newest' | 'oldest';

  @ApiPropertyOptional({
    enum: ['pending', 'dismissed', 'resolved'],
    example: 'pending',
    default: 'pending',
    description: 'Filter reports by status',
  })
  status?: 'pending' | 'dismissed' | 'resolved';

  @ApiPropertyOptional({
    example: 5,
    default: 5,
    description: 'Number of reports to return (default 5)',
  })
  limit?: string;
}
