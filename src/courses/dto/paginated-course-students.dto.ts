import { ApiProperty } from '@nestjs/swagger';
import { CourseStudentDto } from './course-student.dto';

export class PaginatedCourseStudentsDto {
  @ApiProperty({ type: [CourseStudentDto] })
  data!: CourseStudentDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 24 })
  total!: number;
}
