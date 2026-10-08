import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateResourceDto {
  @ApiPropertyOptional({
    example: 'Updated Resource Title',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Updated resource description.',
  })
  @IsOptional()
  @IsString()
  description?: string | null;
}
