import { ApiProperty } from '@nestjs/swagger';
import { ReportDto } from './report.dto';

export class PaginatedReportsDto {
  @ApiProperty({ type: [ReportDto] })
  data!: ReportDto[];

  @ApiProperty({
    example: 1,
    description: 'Total pending reports (ignores current filters)',
  })
  pendingCount!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({
    example: 3,
    description: 'Total reports matching the current filters',
  })
  total!: number;
}
