import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CourseStudentDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Jane' })
  firstName: string;

  @ApiPropertyOptional({ nullable: true, example: 'Marie' })
  middleName: string | null;

  @ApiProperty({ example: 'Smith' })
  lastName: string;

  @ApiProperty({ example: 'jane.smith@example.com' })
  email: string;

  @ApiProperty({ enum: ['admin', 'student'], example: 'student' })
  role: string;

  @ApiProperty({
    enum: ['pending', 'active', 'inactive'],
    example: 'active',
  })
  status: string;

  @ApiPropertyOptional({ nullable: true })
  profilePhotoUrl: string | null;

  @ApiProperty({ description: 'When the student enrolled in this course' })
  enrolledAt: Date;
}
