import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class ChangeUserStatusDto {
  @ApiProperty({
    enum: ['active', 'inactive'],
    example: 'active',
  })
  @IsIn(['active', 'inactive'])
  status!: 'active' | 'inactive';
}
