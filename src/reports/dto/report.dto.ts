import { ApiProperty } from '@nestjs/swagger';

import { ResourceDto } from '../../resources/dto/resource.dto';

export class ReportReporterDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty({ nullable: true, type: String })
  middleName!: string | null;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;
}

export class ReportDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  reason!: string;

  @ApiProperty({ enum: ['pending', 'dismissed', 'resolved'] })
  status!: string;

  @ApiProperty({ type: () => ResourceDto })
  resource!: ResourceDto;

  @ApiProperty({ type: () => ReportReporterDto })
  reporter!: ReportReporterDto;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
