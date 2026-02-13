import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ProfileDto } from '@app/profile/dto/profile.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully registered.',
    type: ProfileDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request.',
  })
  async register(
    @Body()
    body: RegisterDto,
  ) {
    return this.authService.register(body);
  }

  @Post('/login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully logged in.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request.',
  })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('/verify-email')
  @ApiOperation({ summary: 'Verify User Email' })
  @ApiResponse({
    status: 200,
    description: 'Verify email successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request.',
  })
  async verifyUserProfile(@Body() body: any) {
    const stateCode = body?.state_code;
    return this.authService.verifyUserProfileEmail(stateCode);
  }
}
