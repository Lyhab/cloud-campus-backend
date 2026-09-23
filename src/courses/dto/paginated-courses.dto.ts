import { ApiProperty } from '@nestjs/swagger';

import { CourseDto } from './course.dto';

export class PaginatedCoursesDto {
  @ApiProperty({ type: [CourseDto] })
  data: CourseDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;
}
