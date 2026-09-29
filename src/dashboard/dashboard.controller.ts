import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthGuard, AuthenticatedRequest } from '../auth/guards/auth.guard';
import { DashboardService } from './dashboard.service';
import { UploadStatsQueryDto } from './dto/upload-stats-query.dto';
import { RecentResourcesQueryDto } from './dto/recent-resources-query.dto';
import { NewUsersQueryDto } from './dto/new-users-query.dto';
import { PendingReportsQueryDto } from './dto/pending-reports-query.dto';
import { DashboardResourcesQueryDto } from './dto/dashboard-resources-query.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics based on user role' })
  getStats(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getStats(request.user.sub);
  }

  @Get('upload-stats')
  @ApiOperation({ summary: 'Get resource upload statistics' })
  getUploadStats(@Query() query: UploadStatsQueryDto) {
    return this.dashboardService.getUploadStats(query);
  }

  @Get('recent-resources')
  @ApiOperation({ summary: 'Get recently uploaded resources' })
  getRecentResources(@Query() query: RecentResourcesQueryDto) {
    return this.dashboardService.getRecentResources(query);
  }

  @Get('new-users')
  @ApiOperation({ summary: 'Get recently registered users' })
  getNewUsers(@Query() query: NewUsersQueryDto) {
    return this.dashboardService.getNewUsers(query);
  }

  @Get('pending-reports')
  @ApiOperation({ summary: 'Get reports filtered by status (admin only)' })
  getPendingReports(
    @Query() query: PendingReportsQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.dashboardService.getPendingReports(query, request.user.sub);
  }

  @Get('my-courses')
  @ApiOperation({ summary: 'Get courses enrolled by the current student' })
  getMyCourses(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getMyCourses(request.user.sub);
  }

  @Get('resources')
  @ApiOperation({ summary: 'Get popular resources' })
  getResources(@Query() query: DashboardResourcesQueryDto) {
    return this.dashboardService.getResources(query);
  }
}
