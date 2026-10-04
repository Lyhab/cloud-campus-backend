import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateResourceStatusDto {
  @ApiProperty({
    enum: ['pending', 'approved', 'rejected'],
    example: 'approved',
  })
  @IsIn(['pending', 'approved', 'rejected'])
  status!: 'pending' | 'approved' | 'rejected';
}
