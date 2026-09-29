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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthGuard, AuthenticatedRequest } from '../auth/guards/auth.guard';
import {
  OptionalAuthenticatedRequest,
  OptionalAuthGuard,
} from '../auth/guards/optional-auth.guard';

import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { ListResourcesQueryDto } from './dto/list-resources-query.dto';
import { PaginatedResourcesDto } from './dto/paginated-resources.dto';
import { ResourceDto } from './dto/resource.dto';
import { ResourceBookmarkDto } from './dto/resource-bookmark.dto';
import { ResourceRatingDto } from './dto/resource-rating.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { UpdateResourceStatusDto } from './dto/update-resource-status.dto';

type UploadedResourceFile = {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
};

@ApiTags('Resources')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @UseGuards(OptionalAuthGuard)
  @Get()
  @ApiOperation({
    summary: 'List resources',
    description:
      'Search, filter, sort, and paginate resources. Filter by course, file type, bookmarked resources, or the authenticated user’s uploads. Sort by newest, most downloaded, or top rated.',
  })
  @ApiOkResponse({ type: PaginatedResourcesDto })
  @ApiBadRequestResponse({
    description: 'Invalid query parameter',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required for private filters',
  })
  listResources(
    @Query() query: ListResourcesQueryDto,
    @Req() request: OptionalAuthenticatedRequest,
  ): Promise<PaginatedResourcesDto> {
    return this.resourcesService.listResources(query, request.user?.sub);
  }

  @Get(':resourceId')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Get resource details' })
  @ApiParam({
    name: 'resourceId',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({ type: ResourceDto })
  @ApiBadRequestResponse({
    description: 'Invalid resource ID',
  })
  @ApiNotFoundResponse({
    description: 'Resource not found',
  })
  getResource(@Param('resourceId') resourceId: string): Promise<ResourceDto> {
    return this.resourcesService.getResource(resourceId);
  }

  @Get(':resourceId/download')
  @ApiOperation({ summary: 'Download a resource file' })
  @ApiParam({
    name: 'resourceId',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Resource file downloaded successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid resource ID',
  })
  @ApiNotFoundResponse({
    description: 'Resource or file not found',
  })
  async downloadResource(
    @Param('resourceId') resourceId: string,
    @Res() response: Response,
  ): Promise<void> {
    const file = await this.resourcesService.downloadResource(resourceId);

    const safeFileName = file.fileName.replace(/["\\\r\n]/g, '_');

    response.setHeader('Content-Type', file.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFileName}"`,
    );
    response.send(file.buffer);
  }

  @UseGuards(AuthGuard)
  @Get(':resourceId/rating')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get the current user’s resource rating',
  })
  @ApiParam({
    name: 'resourceId',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    type: ResourceRatingDto,
    description:
      'Returns the user’s rating, or null if they have not rated the resource.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid resource ID',
  })
  getResourceRating(
    @Param('resourceId') resourceId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ResourceRatingDto | null> {
    return this.resourcesService.getResourceRating(
      resourceId,
      request.user.sub,
    );
  }

  @Get(':resourceId/related')
  @ApiOperation({
    summary: 'Get related resources in the same course',
  })
  @ApiParam({
    name: 'resourceId',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({ type: [ResourceDto] })
  @ApiBadRequestResponse({
    description: 'Invalid resource ID',
  })
  @ApiNotFoundResponse({
    description: 'Resource not found',
  })
  getRelatedResources(
    @Param('resourceId') resourceId: string,
  ): Promise<ResourceDto[]> {
    return this.resourcesService.getRelatedResources(resourceId);
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a resource' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'courseId', 'file'],
      properties: {
        title: {
          type: 'string',
          example: 'AWS S3 Study Notes',
        },
        description: {
          type: 'string',
          nullable: true,
          example: 'Study notes covering AWS S3.',
        },
        courseId: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: ResourceDto })
  @ApiBadRequestResponse({
    description: 'Invalid resource or file',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @UseInterceptors(FileInterceptor('file'))
  createResource(
    @Body() body: CreateResourceDto,
    @UploadedFile() file: UploadedResourceFile | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<ResourceDto> {
    return this.resourcesService.createResource(body, request.user.sub, file);
  }

  @UseGuards(AuthGuard)
  @Post(':resourceId/bookmark')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Bookmark a resource' })
  @ApiParam({
    name: 'resourceId',
    type: String,
    format: 'uuid',
  })
  @ApiCreatedResponse({ type: ResourceBookmarkDto })
  @ApiBadRequestResponse({
    description: 'Invalid resource ID',
  })
  @ApiNotFoundResponse({
    description: 'Resource not found',
  })
  bookmarkResource(
    @Param('resourceId') resourceId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ResourceBookmarkDto> {
    return this.resourcesService.bookmarkResource(resourceId, request.user.sub);
  }

  @UseGuards(AuthGuard)
  @Post(':resourceId/rating')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Rate a resource' })
  @ApiParam({
    name: 'resourceId',
    type: String,
    format: 'uuid',
  })
  @ApiBody({ type: ResourceRatingDto })
  @ApiCreatedResponse({ type: ResourceRatingDto })
  @ApiBadRequestResponse({
    description: 'Invalid rating',
  })
  @ApiNotFoundResponse({
    description: 'Resource not found',
  })
  rateResource(
    @Param('resourceId') resourceId: string,
    @Body() body: ResourceRatingDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ResourceRatingDto> {
    return this.resourcesService.rateResource(
      resourceId,
      request.user.sub,
      body,
    );
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Patch(':resourceId/status')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Approve or reject a resource (admin only)',
  })
  @ApiParam({
    name: 'resourceId',
    type: String,
    format: 'uuid',
  })
  @ApiBody({ type: UpdateResourceStatusDto })
  @ApiOkResponse({ type: ResourceDto })
  @ApiBadRequestResponse({
    description: 'Invalid status request',
  })
  @ApiNotFoundResponse({
    description: 'Resource not found',
  })
  updateResourceStatus(
    @Param('resourceId') resourceId: string,
    @Body() body: UpdateResourceStatusDto,
  ): Promise<ResourceDto> {
    return this.resourcesService.updateResourceStatus(resourceId, body);
  }

  @UseGuards(AuthGuard)
  @Patch(':resourceId')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update a resource (owner only)',
  })
  @ApiParam({
    name: 'resourceId',
    type: String,
    format: 'uuid',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          example: 'Updated AWS S3 Study Notes',
        },
        description: {
          type: 'string',
          nullable: true,
          example: 'Updated study notes.',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({ type: ResourceDto })
  @ApiBadRequestResponse({
    description: 'Invalid resource update',
  })
  @ApiNotFoundResponse({
    description: 'Resource not found',
  })
  @UseInterceptors(FileInterceptor('file'))
  updateResource(
    @Param('resourceId') resourceId: string,
    @Body() body: UpdateResourceDto,
    @UploadedFile() file: UploadedResourceFile | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<ResourceDto> {
    return this.resourcesService.updateResource(
      resourceId,
      request.user.sub,
      body,
      file,
    );
  }

  @UseGuards(AuthGuard)
  @Delete(':resourceId')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete a resource (owner or admin)',
  })
  @ApiParam({
    name: 'resourceId',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Resource deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid resource ID',
  })
  @ApiNotFoundResponse({
    description: 'Resource not found',
  })
  deleteResource(
    @Param('resourceId') resourceId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return this.resourcesService.deleteResource(resourceId, request.user.sub);
  }

  @UseGuards(AuthGuard)
  @Delete(':resourceId/bookmark')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Remove a resource bookmark',
  })
  @ApiParam({
    name: 'resourceId',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({ type: ResourceBookmarkDto })
  @ApiBadRequestResponse({
    description: 'Invalid resource ID',
  })
  @ApiNotFoundResponse({
    description: 'Bookmark not found',
  })
  removeBookmark(
    @Param('resourceId') resourceId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ResourceBookmarkDto> {
    return this.resourcesService.removeBookmark(resourceId, request.user.sub);
  }
}
