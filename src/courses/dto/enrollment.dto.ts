import { ApiProperty } from '@nestjs/swagger';

export class EnrollmentDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ format: 'uuid' })
  courseId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  joinedAt!: Date;
}

export class EnrollmentMessageDto {
  @ApiProperty({ example: 'Successfully left the course' })
  message!: string;
}
