import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CourseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'COMP101' })
  code!: string;

  @ApiProperty({ example: 'Introduction to Computer Science' })
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Foundational programming and computing concepts.',
  })
  description!: string | null;

  @ApiProperty({ example: 24 })
  studentCount!: number;

  @ApiProperty({ example: 16 })
  resourceCount!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
