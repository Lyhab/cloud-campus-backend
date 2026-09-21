import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty({ nullable: true })
  middleName!: string | null;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({
    enum: ['admin', 'student'],
    example: 'student',
  })
  role!: 'admin' | 'student';

  @ApiProperty({
    enum: ['pending', 'active', 'inactive'],
    example: 'active',
  })
  status!: 'pending' | 'active' | 'inactive';

  @ApiProperty({ nullable: true })
  profilePhotoUrl!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  joinedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
