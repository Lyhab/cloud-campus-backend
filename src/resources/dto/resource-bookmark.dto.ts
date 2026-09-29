import { ApiProperty } from '@nestjs/swagger';

export class ResourceBookmarkDto {
  @ApiProperty({
    example: true,
    description: 'Whether the resource is bookmarked by the caller',
  })
  bookmarked!: boolean;
}
