import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';

import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthGuard, AuthenticatedRequest } from '../auth/guards/auth.guard';

import { ChangeUserRoleDto } from './dto/change-user-role.dto';
import { ChangeUserStatusDto } from './dto/change-user-status.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UserDto } from './dto/user.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard, AdminGuard)
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ type: PaginatedUsersDto })
  @ApiBadRequestResponse({ description: 'Invalid query parameter' })
  listUsers(@Query() query: ListUsersQueryDto): Promise<PaginatedUsersDto> {
    return this.usersService.listUsers(query);
  }

  @UseGuards(AuthGuard)
  @Get(':userId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: UserDto })
  @ApiBadRequestResponse({ description: 'Invalid user ID' })
  @ApiNotFoundResponse({ description: 'User not found' })
  getUser(@Param('userId') userId: string): Promise<UserDto> {
    return this.usersService.getUser(userId);
  }

  @UseGuards(AuthGuard)
  @Patch(':userId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
          example: 'John',
        },
        middleName: {
          type: 'string',
          nullable: true,
          example: 'Michael',
        },
        lastName: {
          type: 'string',
          example: 'Smith',
        },
        profilePhoto: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({ type: UserDto })
  @ApiBadRequestResponse({
    description: 'Invalid user ID or update request',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @UseInterceptors(FileInterceptor('profilePhoto'))
  updateUser(
    @Param('userId') userId: string,
    @Body() body: UpdateUserDto,
    @UploadedFile()
    profilePhoto:
      | {
          originalname: string;
          buffer: Buffer;
          mimetype: string;
        }
      | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<UserDto> {
    return this.usersService.updateUser(
      userId,
      request.user.sub,
      body,
      profilePhoto,
    );
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Patch(':userId/role')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change user role' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiBody({ type: ChangeUserRoleDto })
  @ApiOkResponse({ type: UserDto })
  @ApiBadRequestResponse({ description: 'Invalid user ID or role request' })
  @ApiNotFoundResponse({ description: 'User not found' })
  changeUserRole(
    @Param('userId') userId: string,
    @Body() body: ChangeUserRoleDto,
  ): Promise<UserDto> {
    return this.usersService.changeUserRole(userId, body);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Patch(':userId/status')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change user status' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiBody({ type: ChangeUserStatusDto })
  @ApiOkResponse({ type: UserDto })
  @ApiBadRequestResponse({
    description: 'Invalid user ID or status request',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  changeUserStatus(
    @Param('userId') userId: string,
    @Body() body: ChangeUserStatusDto,
  ): Promise<UserDto> {
    return this.usersService.changeUserStatus(userId, body);
  }

  @UseGuards(AuthGuard)
  @Patch(':userId/password')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change user password' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({ description: 'Password changed successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid password or password confirmation',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  changePassword(
    @Param('userId') userId: string,
    @Body() body: ChangePasswordDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const authorization = request.headers.authorization;
    const accessToken = authorization?.replace(/^Bearer\s+/i, '').trim();

    if (!accessToken) {
      throw new UnauthorizedException('Access token is required.');
    }

    return this.usersService.changePassword(
      userId,
      request.user.sub,
      accessToken,
      body.oldPassword,
      body.newPassword,
      body.confirmPassword,
    );
  }
}
