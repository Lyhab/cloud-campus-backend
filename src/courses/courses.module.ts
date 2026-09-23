import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DbModule } from '../db/db.module';

import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
