import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'COMP101', maxLength: 50 })
  code?: string;

  @ApiPropertyOptional({
    example: 'Introduction to Computer Science',
    maxLength: 255,
  })
  name?: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Foundational programming and computing concepts.',
  })
  description?: string | null;
}
