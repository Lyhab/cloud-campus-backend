import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateReportStatusDto {
  @ApiProperty({
    enum: ['dismissed', 'resolved'],
    example: 'resolved',
  })
  @IsIn(['dismissed', 'resolved'])
  status!: 'dismissed' | 'resolved';
}
