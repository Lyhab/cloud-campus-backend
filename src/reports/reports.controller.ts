import {
  Body,
  Controller,
  Get,
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

import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsQueryDto } from './dto/list-reports-query.dto';
import { PaginatedReportsDto } from './dto/paginated-reports.dto';
import { ReportDto } from './dto/report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @UseGuards(AuthGuard, AdminGuard)
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'List reports (admin only)',
    description:
      'Search, filter by status, sort by newest or oldest, and paginate reports.',
  })
  @ApiOkResponse({ type: PaginatedReportsDto })
  @ApiBadRequestResponse({
    description: 'Invalid query parameter',
  })
  listReports(
    @Query() query: ListReportsQueryDto,
  ): Promise<PaginatedReportsDto> {
    return this.reportsService.listReports(query);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Get(':reportId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get report details (admin only)' })
  @ApiParam({
    name: 'reportId',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({ type: ReportDto })
  @ApiBadRequestResponse({
    description: 'Invalid report ID',
  })
  @ApiNotFoundResponse({
    description: 'Report not found',
  })
  getReport(@Param('reportId') reportId: string): Promise<ReportDto> {
    return this.reportsService.getReport(reportId);
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Report a resource' })
  @ApiBody({ type: CreateReportDto })
  @ApiCreatedResponse({ type: ReportDto })
  @ApiBadRequestResponse({
    description: 'Invalid report payload',
  })
  @ApiNotFoundResponse({
    description: 'Resource not found',
  })
  @ApiConflictResponse({
    description: 'You already have a pending report for this resource',
  })
  createReport(
    @Body() body: CreateReportDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ReportDto> {
    return this.reportsService.createReport(body, request.user.sub);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Patch(':reportId/status')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Dismiss or resolve a report (admin only)',
  })
  @ApiParam({
    name: 'reportId',
    type: String,
    format: 'uuid',
  })
  @ApiBody({ type: UpdateReportStatusDto })
  @ApiOkResponse({ type: ReportDto })
  @ApiBadRequestResponse({
    description: 'Invalid status request',
  })
  @ApiNotFoundResponse({
    description: 'Report not found',
  })
  updateReportStatus(
    @Param('reportId') reportId: string,
    @Body() body: UpdateReportStatusDto,
  ): Promise<ReportDto> {
    return this.reportsService.updateReportStatus(reportId, body);
  }
}
