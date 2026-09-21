import { ApiProperty } from '@nestjs/swagger';

export class ChangeUserRoleDto {
  @ApiProperty({
    enum: ['admin', 'student'],
    example: 'student',
  })
  role!: 'admin' | 'student';
}
