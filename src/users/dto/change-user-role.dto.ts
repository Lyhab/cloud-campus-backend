import { ApiProperty } from '@nestjs/swagger';

export class ChangeUserRoleDto {
  @ApiProperty({ enum: ['ADMIN', 'STUDENT'], example: 'STUDENT' })
  role: 'ADMIN' | 'STUDENT';
}
