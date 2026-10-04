import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'COMP101', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({
    example: 'Introduction to Computer Science',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Foundational programming and computing concepts.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;
}
