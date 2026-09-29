import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResourceDto {
  @ApiProperty({ example: 'Introduction to Algorithms', maxLength: 255 })
  title!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Lecture notes covering fundamental algorithms.',
  })
  description?: string | null;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  courseId!: string;
}
