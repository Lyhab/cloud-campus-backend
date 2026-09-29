import { ApiProperty } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  resourceId!: string;

  @ApiProperty({
    example: 'Possible copyright infringement.',
    maxLength: 1000,
  })
  reason!: string;
}
