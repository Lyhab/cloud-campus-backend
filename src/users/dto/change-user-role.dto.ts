import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class ChangeUserRoleDto {
  @ApiProperty({
    enum: ['admin', 'student'],
    example: 'student',
  })
  @IsIn(['admin', 'student'])
  role!: 'admin' | 'student';
}
