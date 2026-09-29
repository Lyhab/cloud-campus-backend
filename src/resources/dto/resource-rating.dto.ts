import { ApiProperty } from '@nestjs/swagger';

export class ResourceRatingDto {
  @ApiProperty({
    example: 4,
    minimum: 1,
    maximum: 5,
    description: 'Resource rating (1–5)',
  })
  rating!: number;
}
