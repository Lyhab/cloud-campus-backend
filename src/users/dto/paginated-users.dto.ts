import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class PaginatedUsersDto {
  @ApiProperty({ type: [UserDto] })
  data!: UserDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;
}
