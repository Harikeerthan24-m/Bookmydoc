import {
  Controller,
  Get,
  Req,
  UseGuards,
  Post,
  HttpException,
  HttpStatus,
  Body,
  Query,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from '@app/auth/guard/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { IRole } from '@app/common/types/type';
import { AvailabilitySlot } from './dto/availability.dto';
import { DAYS_Of_WEEK } from './type';

@Controller('availability')
@ApiBearerAuth()
@ApiTags('availability')
@UseGuards(RolesGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('/slots')
  @Roles(IRole.DOCTOR, IRole.ADMIN)
  @ApiOperation({ summary: 'Get doctor availability' })
  @ApiResponse({
    status: 200,
    description: 'doctor availability slots response.',
    type: [AvailabilitySlot],
  })
  @ApiResponse({
    status: 400,
    description: 'doctor availability slots response.',
  })
  async getAvailabilitySlots(@Req() req: any, @Query() query: any) {
    const filters = {} as any;
    if (req.user.role !== IRole.ADMIN) {
      filters.doctorId = req.user.uid;
    }
    if (query?.date) {
      const date = new Date(query?.date);
      filters.day = DAYS_Of_WEEK[date.getDay()];
    }
    return await this.availabilityService.getAvailabilitySlots(filters);
  }

  @Post('/slots')
  @Roles(IRole.DOCTOR)
  @ApiOperation({ summary: 'Save doctor availability slots' })
  @ApiBody({
    type: [AvailabilitySlot],
  })
  @ApiResponse({
    status: 200,
    description: 'doctor availability slots response.',
    type: [AvailabilitySlot],
  })
  @ApiResponse({
    status: 400,
    description: 'doctor availability slots response.',
  })
  async saveAvailabilitySlots(
    @Req() req: any,
    @Body() body: AvailabilitySlot[],
  ) {
    const userId = req.user.uid;
    const payload = body;
    if (!Array.isArray(payload)) {
      throw new HttpException('Invalid payload', HttpStatus.BAD_REQUEST);
    }
    return await this.availabilityService.saveAvailabilitySlots(
      userId,
      payload,
    );
  }
}
