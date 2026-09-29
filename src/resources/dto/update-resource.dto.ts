import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateResourceDto {
  @ApiPropertyOptional({ example: 'Updated Resource Title', maxLength: 255 })
  title?: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Updated resource description.',
  })
  description?: string | null;
}
