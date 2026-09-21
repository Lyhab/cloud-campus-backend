import { ApiProperty } from '@nestjs/swagger';

export class ChangeUserStatusDto {
  @ApiProperty({
    enum: ['active', 'inactive'],
    example: 'active',
  })
  status!: 'active' | 'inactive';
}
