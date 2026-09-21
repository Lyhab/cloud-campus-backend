import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthGuard } from '../auth/guards/auth.guard';
import { S3Service } from './s3.service';

@ApiTags('S3')
@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @UseGuards(AuthGuard)
  @Post('upload')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Upload a file to S3',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: ['profile', 'file', 'image'],
          example: 'file',
        },
      },
      required: ['file', 'type'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile()
    file: {
      originalname: string;
      buffer: Buffer;
      mimetype: string;
    },
    @Body('type') type: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    if (!['profile', 'file', 'image'].includes(type)) {
      throw new BadRequestException('type must be profile, file, or image.');
    }

    const folderMap: Record<string, string> = {
      profile: 'profiles',
      file: 'resources/files',
      image: 'resources/images',
    };

    const folder = folderMap[type];

    const key = `${folder}/${Date.now()}-${file.originalname}`;

    const uploadedKey = await this.s3Service.upload(
      key,
      file.buffer,
      file.mimetype,
    );

    return {
      message: 'File uploaded successfully.',
      key: uploadedKey,
    };
  }

  @UseGuards(AuthGuard)
  @Delete()
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete a file from S3',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          example: 'resources/images/1726940000000-image.jpg',
        },
      },
      required: ['key'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
  })
  async deleteFile(@Body('key') key: string) {
    if (!key) {
      throw new BadRequestException('S3 object key is required.');
    }

    await this.s3Service.delete(key);

    return {
      message: 'File deleted successfully.',
      key,
    };
  }
}
