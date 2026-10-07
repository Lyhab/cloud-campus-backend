import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class ResourceRatingDto {
  @ApiProperty({
    example: 4,
    minimum: 1,
    maximum: 5,
    description: 'Resource rating (1–5)',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
}
