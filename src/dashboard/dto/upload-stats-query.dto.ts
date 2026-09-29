import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadStatsQueryDto {
  @ApiPropertyOptional({
    enum: ['1month', '3months', '6months', '12months'],
    example: '6months',
    default: '6months',
    description: 'Time period for upload statistics',
  })
  period?: '1month' | '3months' | '6months' | '12months';
}
