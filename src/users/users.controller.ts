import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiTags,
} from '@nestjs/swagger';
import { ChangeUserRoleDto } from './dto/change-user-role.dto';
import { ChangeUserStatusDto } from './dto/change-user-status.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UserDto } from './dto/user.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ type: PaginatedUsersDto })
  @ApiBadRequestResponse({ description: 'Invalid query parameter' })
  listUsers(@Query() query: ListUsersQueryDto): Promise<PaginatedUsersDto> {
    return this.usersService.listUsers(query);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: UserDto })
  @ApiBadRequestResponse({ description: 'Invalid user ID' })
  @ApiNotFoundResponse({ description: 'User not found' })
  getUser(@Param('userId', ParseUUIDPipe) userId: string): Promise<UserDto> {
    return this.usersService.getUser(userId);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ type: UserDto })
  @ApiBadRequestResponse({ description: 'Invalid user ID or update request' })
  @ApiNotFoundResponse({ description: 'User not found' })
  updateUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: UpdateUserDto,
  ): Promise<UserDto> {
    return this.usersService.updateUser(userId, body);
  }

  @Patch(':userId/role')
  @ApiOperation({ summary: 'Change user role' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiBody({ type: ChangeUserRoleDto })
  @ApiOkResponse({ type: UserDto })
  @ApiBadRequestResponse({ description: 'Invalid user ID or role request' })
  @ApiNotFoundResponse({ description: 'User not found' })
  changeUserRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: ChangeUserRoleDto,
  ): Promise<UserDto> {
    return this.usersService.changeUserRole(userId, body);
  }

  @Patch(':userId/status')
  @ApiOperation({ summary: 'Change user status' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiBody({ type: ChangeUserStatusDto })
  @ApiOkResponse({ type: UserDto })
  @ApiBadRequestResponse({ description: 'Invalid user ID or status request' })
  @ApiNotFoundResponse({ description: 'User not found' })
  changeUserStatus(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: ChangeUserStatusDto,
  ): Promise<UserDto> {
    return this.usersService.changeUserStatus(userId, body);
  }
}
