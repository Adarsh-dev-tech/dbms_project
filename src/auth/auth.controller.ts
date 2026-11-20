import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthLoginDto, AuthRegisterDto } from './dto/auth.dto';
import { Public } from './public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return JWT access token' })
  async login(@Body() dto: AuthLoginDto) {
    const data = await this.authService.login(dto);
    return {
      statusCode: HttpStatus.OK,
      message: data,
      error: null,
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new organization and admin user account',
  })
  async register(@Body() dto: AuthRegisterDto) {
    const data = await this.authService.register(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: data,
      error: null,
    };
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get the currently authenticated user profile' })
  async me(@Req() req: any) {
    const data = await this.authService.getProfile(req.user.id);
    return {
      statusCode: HttpStatus.OK,
      message: data,
      error: null,
    };
  }
}
