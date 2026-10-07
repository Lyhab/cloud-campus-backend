import { ApiProperty } from '@nestjs/swagger';

export class AvailableStudentDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty({ type: String, nullable: true })
  middleName!: string | null;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ type: String, nullable: true })
  profilePhotoUrl!: string | null;
}

export class PaginatedAvailableStudentsDto {
  @ApiProperty({ type: [AvailableStudentDto] })
  data!: AvailableStudentDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;
}
