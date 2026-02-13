import {
  Controller,
  Get,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
  Query,
  Param,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from '@app/auth/guard/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { IRole } from '@app/common/types/type';
import { DoctorFilterDto } from './dto/filters.dto';
import { DoctorDto } from './dto/doctor.dto';

@Controller('doctors')
@ApiBearerAuth()
@ApiTags('doctor')
@UseGuards(RolesGuard)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get('/')
  @Roles(IRole.CUSTOMER, IRole.ADMIN)
  @ApiOperation({ summary: 'Get doctors' })
  @ApiResponse({
    status: 200,
    description: 'doctors response.',
    type: [DoctorDto],
  })
  @ApiResponse({
    status: 400,
    description: 'doctors response.',
  })
  async getDoctors(@Req() req: any, @Query() query: DoctorFilterDto) {
    const filters = { ...query } as any;
    const userRole = req?.user?.role;
    return await this.doctorService.getDoctors(filters, userRole);
  }

  @Get('/:doctor_id')
  @Roles(IRole.CUSTOMER, IRole.ADMIN)
  @ApiOperation({ summary: 'Get doctor details' })
  @ApiResponse({
    status: 200,
    description: 'doctor details response.',
    type: () => DoctorDto,
  })
  @ApiResponse({
    status: 400,
    description: 'doctor details response.',
  })
  async getDoctorDetails(
    @Req() req: any,
    @Param('doctor_id') doctorId: string,
  ) {
    if (!doctorId) {
      throw new HttpException('Doctor id is required', HttpStatus.BAD_REQUEST);
    }
    const userRole = req?.user?.role;
    return await this.doctorService.getDoctorDetails(doctorId, userRole);
  }
}
