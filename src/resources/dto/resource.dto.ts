import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResourceCreatorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiPropertyOptional({ nullable: true })
  middleName?: string | null;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional({ nullable: true })
  profilePhotoUrl?: string | null;
}

export class ResourceCourseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;
}

export class ResourceDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty()
  fileUrl!: string;

  @ApiProperty()
  fileType!: string;

  @ApiPropertyOptional({ nullable: true })
  fileSizeMb?: string | null;

  @ApiProperty()
  downloads!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  avgRating!: string;

  @ApiProperty()
  ratingCount!: number;

  @ApiProperty({ type: () => ResourceCreatorDto })
  creator!: ResourceCreatorDto;

  @ApiProperty({ type: () => ResourceCourseDto })
  course!: ResourceCourseDto;

  @ApiProperty({ type: String, format: 'date-time' })
  uploadedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
