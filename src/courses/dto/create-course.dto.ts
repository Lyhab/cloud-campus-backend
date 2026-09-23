import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'COMP101', maxLength: 50 })
  code: string;

  @ApiProperty({
    example: 'Introduction to Computer Science',
    maxLength: 255,
  })
  name: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Foundational programming and computing concepts.',
  })
  description?: string | null;
}
