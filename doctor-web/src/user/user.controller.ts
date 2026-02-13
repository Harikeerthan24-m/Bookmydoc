import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { RolesGuard } from '../auth/guard/roles.guard';
import { IApiResponse, IUnsafeObject } from '@common/types';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

@Controller('user')
@ApiBearerAuth()
@ApiTags('user')
@UseGuards(RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/logout')
  @ApiOperation({ summary: 'Logout User' })
  @ApiResponse({
    status: 200,
    description: 'Logout user successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request.',
  })
  async getProfile(@Req() req: any): Promise<IApiResponse<IUnsafeObject>> {
    const userId = req.user.uid;
    return this.userService.logout(userId);
  }

  @Get('/auth-check')
  @ApiOperation({ summary: 'Auth user check' })
  @ApiResponse({
    status: 200,
    description: 'The user is there in the system.',
  })
  @ApiResponse({
    status: 400,
    description: 'The user is there in the system.',
  })
  async authCheck(@Req() req: any): Promise<IApiResponse<IUnsafeObject>> {
    const userId = req.user.uid;
    return this.userService.userAuthChecker(userId);
  }
}
