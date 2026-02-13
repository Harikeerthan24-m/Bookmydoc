import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { ServiceDto } from './dto/create-service.dto';
import { FirebaseService } from '../firebase/firebase.service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesGuard } from '../auth/guard/roles.guard';

@Controller('service')
@ApiBearerAuth()
@ApiTags('service')
@UseGuards(RolesGuard)
export class ServiceController {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Fetch all services for the authenticated doctor' })
  @ApiResponse({
    status: 200,
    description: 'Services fetched successfully.',
    type: [ServiceDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request.',
  })
  async findAll(@Request() req) {
    if (!req.user || !req.user.uid) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.serviceService.findAllByDoctor(req.user.uid);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single service by ID' })
  @ApiResponse({
    status: 200,
    description: 'Service fetched successfully.',
    type: ServiceDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found.',
  })
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create Service' })
  @ApiResponse({
    status: 200,
    description: 'Service created successfully.',
    type: ServiceDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request.',
  })
  async create(@Body() serviceData: Partial<ServiceDto>, @Request() req) {
    if (!req.user || !req.user.uid) {
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      // Get the user's profile from Firebase
      const profileDoc = await this.firebaseService
        .getFirestore()
        .collection('profiles')
        .doc(req.user.uid)
        .get();

      if (!profileDoc.exists) {
        throw new UnauthorizedException('Doctor profile not found');
      }

      // Create a complete DTO with the createdBy field
      const createServiceDto = new ServiceDto();
      Object.assign(createServiceDto, serviceData, {
        createdBy: req.user.uid,
      });

      return this.serviceService.create(createServiceDto);
    } catch (error) {
      throw new UnauthorizedException('Failed to verify doctor profile');
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Service' })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully.',
    type: ServiceDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request.',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() serviceData: Partial<ServiceDto>,
    @Request() req,
  ) {
    if (!req.user || !req.user.uid) {
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      // Get the user's profile from Firebase
      const profileDoc = await this.firebaseService
        .getFirestore()
        .collection('profiles')
        .doc(req.user.uid)
        .get();

      if (!profileDoc.exists) {
        throw new UnauthorizedException('Doctor profile not found');
      }

      // Create a complete DTO with the createdBy field
      const updateServiceDto = new ServiceDto();
      Object.assign(updateServiceDto, serviceData, {
        createdBy: req.user.uid,
      });

      return this.serviceService.update(id, updateServiceDto);
    } catch (error) {
      throw new UnauthorizedException('Failed to verify doctor profile');
    }
  }

  @ApiOperation({ summary: 'Delete Service' })
  @ApiResponse({
    status: 200,
    description: 'Service deleted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request.',
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceService.remove(id);
  }
}
