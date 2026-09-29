import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthGuard, AuthenticatedRequest } from '../auth/guards/auth.guard';
import {
  OptionalAuthGuard,
  OptionalAuthenticatedRequest,
} from '../auth/guards/optional-auth.guard';

import { CoursesService } from './courses.service';
import { CourseDto } from './dto/course.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { EnrollmentDto, EnrollmentMessageDto } from './dto/enrollment.dto';
import { ListCourseStudentsQueryDto } from './dto/list-course-students-query.dto';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto';
import { PaginatedCourseStudentsDto } from './dto/paginated-course-students.dto';
import { PaginatedCoursesDto } from './dto/paginated-courses.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @UseGuards(OptionalAuthGuard)
  @Get()
  @ApiOperation({
    summary: 'List courses',
    description:
      'Search, filter, sort, and paginate courses. Use filter=my-courses to return only courses the authenticated user is enrolled in. Filter by code and sort by alphabetical, newest, or oldest.',
  })
  @ApiOkResponse({ type: PaginatedCoursesDto })
  @ApiBadRequestResponse({ description: 'Invalid query parameter' })
  listCourses(
    @Query() query: ListCoursesQueryDto,
    @Req() request: OptionalAuthenticatedRequest,
  ): Promise<PaginatedCoursesDto> {
    return this.coursesService.listCourses(query, request.user?.sub);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get(':courseId/students')
  @ApiOperation({ summary: 'List students enrolled in a course' })
  @ApiParam({
    name: 'courseId',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({ type: PaginatedCourseStudentsDto })
  @ApiBadRequestResponse({
    description: 'Invalid course ID or query parameter',
  })
  @ApiNotFoundResponse({ description: 'Course not found' })
  listCourseStudents(
    @Param('courseId') courseId: string,
    @Query() query: ListCourseStudentsQueryDto,
  ): Promise<PaginatedCourseStudentsDto> {
    return this.coursesService.listCourseStudents(courseId, query);
  }

  @Get(':courseId')
  @ApiOperation({ summary: 'Get course details' })
  @ApiParam({
    name: 'courseId',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({ type: CourseDto })
  @ApiBadRequestResponse({ description: 'Invalid course ID' })
  @ApiNotFoundResponse({ description: 'Course not found' })
  getCourse(@Param('courseId') courseId: string): Promise<CourseDto> {
    return this.coursesService.getCourse(courseId);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post()
  @ApiOperation({ summary: 'Create a course (admin only)' })
  @ApiBody({ type: CreateCourseDto })
  @ApiCreatedResponse({ type: CourseDto })
  @ApiBadRequestResponse({ description: 'Invalid course payload' })
  @ApiConflictResponse({
    description: 'Course code already exists',
  })
  createCourse(@Body() body: CreateCourseDto): Promise<CourseDto> {
    return this.coursesService.createCourse(body);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post(':courseId/enrollment')
  @ApiOperation({
    summary: 'Enroll the authenticated user in a course',
  })
  @ApiParam({
    name: 'courseId',
    type: String,
    format: 'uuid',
  })
  @ApiCreatedResponse({ type: EnrollmentDto })
  @ApiBadRequestResponse({
    description: 'User is not active or request is invalid',
  })
  @ApiNotFoundResponse({
    description: 'Course or user not found',
  })
  @ApiConflictResponse({
    description: 'Already enrolled in this course',
  })
  enrollSelf(
    @Param('courseId') courseId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<EnrollmentDto> {
    return this.coursesService.enrollSelf(courseId, request.user.sub);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post(':courseId/students/:userId')
  @ApiOperation({
    summary: 'Enroll a student in a course (admin only)',
  })
  @ApiParam({
    name: 'courseId',
    type: String,
    format: 'uuid',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    format: 'uuid',
  })
  @ApiCreatedResponse({ type: EnrollmentDto })
  @ApiBadRequestResponse({
    description: 'User is not active or request is invalid',
  })
  @ApiNotFoundResponse({
    description: 'Course or user not found',
  })
  @ApiConflictResponse({
    description: 'Already enrolled in this course',
  })
  enrollStudent(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
  ): Promise<EnrollmentDto> {
    return this.coursesService.enrollStudent(courseId, userId);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Patch(':courseId')
  @ApiOperation({
    summary: 'Update a course (admin only)',
  })
  @ApiParam({
    name: 'courseId',
    type: String,
    format: 'uuid',
  })
  @ApiBody({ type: UpdateCourseDto })
  @ApiOkResponse({ type: CourseDto })
  @ApiBadRequestResponse({
    description: 'Invalid course payload',
  })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @ApiConflictResponse({
    description: 'Course code already exists',
  })
  updateCourse(
    @Param('courseId') courseId: string,
    @Body() body: UpdateCourseDto,
  ): Promise<CourseDto> {
    return this.coursesService.updateCourse(courseId, body);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete(':courseId')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Delete a course (admin only)',
  })
  @ApiParam({
    name: 'courseId',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Course deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Course still has resources and cannot be deleted',
  })
  @ApiNotFoundResponse({
    description: 'Course not found',
  })
  deleteCourse(
    @Param('courseId') courseId: string,
  ): Promise<{ message: string }> {
    return this.coursesService.deleteCourse(courseId);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete(':courseId/enrollment')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Leave / unenroll from a course',
  })
  @ApiParam({
    name: 'courseId',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({ type: EnrollmentMessageDto })
  @ApiNotFoundResponse({
    description: 'Course not found or user is not enrolled',
  })
  unenrollSelf(
    @Param('courseId') courseId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return this.coursesService.unenrollSelf(courseId, request.user.sub);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete(':courseId/students/:userId')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Unenroll a specific student from a course (admin only)',
  })
  @ApiParam({
    name: 'courseId',
    type: String,
    format: 'uuid',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({ type: EnrollmentMessageDto })
  @ApiNotFoundResponse({
    description: 'Course not found or student is not enrolled',
  })
  unenrollStudent(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
  ): Promise<{ message: string }> {
    return this.coursesService.unenrollStudent(courseId, userId);
  }
}
