import { Module } from '@nestjs/common';

import { DbModule } from '../db/db.module';
import { AuthModule } from '../auth/auth.module';
import { S3Module } from '../s3/s3.module';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DbModule, AuthModule, S3Module],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
