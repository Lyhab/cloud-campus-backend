import { ApiProperty } from '@nestjs/swagger';

export class UpdateReportStatusDto {
  @ApiProperty({
    enum: ['dismissed', 'resolved'],
    example: 'resolved',
  })
  status!: 'dismissed' | 'resolved';
}
