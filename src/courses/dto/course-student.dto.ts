import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CourseStudentDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Jane' })
  firstName!: string;

  @ApiPropertyOptional({ nullable: true, example: 'Marie' })
  middleName!: string | null;

  @ApiProperty({ example: 'Smith' })
  lastName!: string;

  @ApiProperty({ example: 'jane.smith@example.com' })
  email!: string;

  @ApiPropertyOptional({ nullable: true })
  profilePhotoUrl!: string | null;

  @ApiProperty({
    description: 'When the student enrolled in this course',
    type: String,
    format: 'date-time',
  })
  enrolledAt!: Date;
}
