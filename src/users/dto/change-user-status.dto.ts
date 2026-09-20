import { ApiProperty } from '@nestjs/swagger';

export class ChangeUserStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'DISABLED'], example: 'ACTIVE' })
  status: 'ACTIVE' | 'DISABLED';
}
