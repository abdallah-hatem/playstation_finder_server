import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { ApiResponseSuccess } from '../common/decorators/api-response.decorator';

// @ApiTags('users')
@Controller('users')
@UseInterceptors(ResponseInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Post()
  // @ApiOperation({ summary: 'Create a new user' })
  // @ApiResponseSuccess({ message: 'User created successfully' })
  // create(@Body() createUserDto: CreateUserDto) {
  //   return this.userService.create(createUserDto);
  // }

  // @Get()
  // @ApiOperation({ summary: 'Get all users' })
  // @ApiResponseSuccess({ message: 'Users retrieved successfully' })
  // findAll() {
  //   return this.userService.findAll();
  // }

  // @Get(':id')
  // @ApiOperation({ summary: 'Get user by ID' })
  // @ApiResponseSuccess({ message: 'User retrieved successfully' })
  // findOne(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.userService.findOne(id);
  // }

  // @Get(':id/reservations')
  // @ApiOperation({ summary: 'Get user with their reservations' })
  // @ApiResponseSuccess({ message: 'User with reservations retrieved successfully' })
  // findWithReservations(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.userService.findWithReservations(id);
  // }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Update user' })
  // @ApiResponseSuccess({ message: 'User updated successfully' })
  // update(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Body() updateUserDto: Partial<CreateUserDto>,
  // ) {
  //   return this.userService.update(id, updateUserDto);
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete user' })
  // @ApiResponseSuccess({ message: 'User deleted successfully' })
  // remove(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.userService.remove(id);
  // }
} 