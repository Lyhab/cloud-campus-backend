import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthGuard, AuthenticatedRequest } from '../auth/guards/auth.guard';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('Search')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Search resources and courses, with additional admin results',
  })
  @ApiOkResponse({
    description: 'Search results grouped by type',
    schema: {
      example: {
        resources: [
          {
            id: 'resource-id',
            title: 'AWS S3 Study Notes',
            fileType: 'XLSX',
            course: {
              id: 'course-id',
              code: 'INFS803',
              name: 'Cloud Computing',
            },
          },
        ],
        courses: [
          {
            id: 'course-id',
            code: 'INFS803',
            name: 'Cloud Computing',
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  search(@Query() query: SearchQueryDto, @Req() request: AuthenticatedRequest) {
    return this.searchService.search(query, request.user.sub);
  }
}
