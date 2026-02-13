import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/facts')
  @ApiOperation({ summary: 'Get facts' })
  @ApiResponse({
    status: 200,
    description: 'medical facts response.',
  })
  @ApiResponse({
    status: 400,
    description: 'medical facts response.',
  })
  async getFacts(@Query() query: any) {
    return this.appService.getFacts(query?.seed);
  }
}
