import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { HomepageService } from './homepage.service';

@ApiTags('Homepage')
@Controller('homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Get()
  @ApiOperation({ summary: 'Get homepage statistics' })
  @ApiOkResponse({
    description: 'Homepage statistics retrieved successfully',
    schema: {
      example: {
        totalStudents: 1200,
        totalCourses: 6,
        totalResources: 195,
        totalDownloads: 12000,
      },
    },
  })
  getHomepageStats() {
    return this.homepageService.getHomepageStats();
  }
}
