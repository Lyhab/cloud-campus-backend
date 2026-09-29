import { ApiProperty } from '@nestjs/swagger';
import { ResourceDto } from './resource.dto';

export class PaginatedResourcesDto {
  @ApiProperty({ type: [ResourceDto] })
  data!: ResourceDto[];

  @ApiProperty({
    example: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        code: 'COMP809',
        name: 'Data Mining and Machine Learning',
      },
    ],
  })
  courses!: {
    id: string;
    code: string;
    name: string;
  }[];

  @ApiProperty({
    example: ['pdf', 'docx', 'pptx'],
    type: [String],
  })
  fileTypes!: string[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 100 })
  total!: number;
}
