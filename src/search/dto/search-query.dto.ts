import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiPropertyOptional({
    description: 'Search query',
    example: 'AWS',
  })
  q!: string;

  @ApiPropertyOptional({
    description: 'Maximum number of results per category',
    example: 10,
    default: 10,
  })
  limit?: string;
}
