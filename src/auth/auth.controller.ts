import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './services/auth.service';
import { GetUser } from '../common/decorator';
import { Role, User } from '../database/entities';
import { ActiveGuard, OpaqueAuthGuard, RolesGuard } from './guard';
import { SetPasswordDto } from './dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthenticatedUserResponseDto } from './dto/authenticated-user.dto';
import { Roles } from './decorator';

@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Login with username and password' })
  @ApiResponse({
    status: 200,
    description: 'Token generated successfully',
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Phone or password is bad',
  })
  @ApiResponse({
    status: 472,
    description: 'device mismatch',
  })
  @ApiBody({ type: LoginDto })
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Logs out the user of the current session' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'the user is logged out',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized in case a user is not authenticated (missing token)',
  })
  @UseGuards(OpaqueAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STUDENT, Role.COMPANY)
  @HttpCode(HttpStatus.OK)
  @Post('/logout')
  async logout(@GetUser() user: User) {
    return await this.authService.logout(user);
  }

  @ApiOperation({ summary: 'Sets a new password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'the password has been set',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized in case a user is not authenticated (missing token), old password incorrect, ',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User account is not activated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'password not good enough',
  })
  @UseGuards(OpaqueAuthGuard, ActiveGuard)
  @Patch('/set-password')
  async setPassword(@GetUser() user: User, @Body() dto: SetPasswordDto) {
    return this.authService.setPassword(user, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN)
  @UseGuards(OpaqueAuthGuard, RolesGuard)
  @Delete('/reset-all-sessions/:userId')
  async resetSessions(@Param('userId', ParseIntPipe) userId: number) {
    await this.authService.resetSessions(userId);
  }
}
