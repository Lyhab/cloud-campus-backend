import { ApiProperty } from '@nestjs/swagger';

export class UpdateResourceStatusDto {
  @ApiProperty({
    enum: ['pending', 'approved', 'rejected'],
    example: 'approved',
  })
  status!: 'pending' | 'approved' | 'rejected';
}
