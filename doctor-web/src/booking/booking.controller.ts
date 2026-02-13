import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from '@app/auth/guard/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { IRole } from '@app/common/types/type';
import {
  BookingUpdateDto,
  BookingDto,
  BookingCreateDto,
} from './dto/booking.dto';
import { BookingFilterDto } from './dto/filters.dto';
import { CreatePaymentDto } from './dto/payment.dto';
import { ReviewDto } from './dto/review.dto';

@Controller('bookings')
@ApiBearerAuth()
@ApiTags('booking')
@UseGuards(RolesGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('/')
  @Roles(IRole.CUSTOMER, IRole.DOCTOR, IRole.ADMIN)
  @ApiOperation({ summary: 'Get Bookings' })
  @ApiQuery({
    name: 'filters',
    type: BookingFilterDto,
    description: 'Filter criteria for booking',
  })
  @ApiResponse({
    status: 200,
    description: 'get user bookings success response.',
    type: [BookingDto],
  })
  @ApiResponse({
    status: 400,
    description: 'get user bookings error response.',
  })
  async getBookings(@Req() req: any, @Query() query: any) {
    const filters = {} as BookingFilterDto;
    if (req.user.role !== IRole.ADMIN) {
      if (req.user?.role === IRole.CUSTOMER) {
        filters.customer_id = req.user.uid;
      }
      if (req.user?.role === IRole.DOCTOR) {
        filters.doctor_id = req.user.uid;
      }
    }
    if (query?.status) {
      filters.status = query?.status;
    }
    if (query?.order_by) {
      filters.order_by = query?.order_by?.toLowerCase();
    }

    return await this.bookingService.getBookings(filters, req.user.role);
  }

  @Get('/:booking_id')
  @Roles(IRole.CUSTOMER, IRole.DOCTOR, IRole.ADMIN)
  @ApiOperation({ summary: 'Get Booking' })
  @ApiResponse({
    status: 200,
    description: 'get user booking success response.',
    type: BookingDto,
  })
  @ApiResponse({
    status: 400,
    description: 'get user booking error response.',
  })
  async getBooking(@Param('booking_id') bookingId: string, @Req() req: any) {
    const filters = {} as BookingFilterDto;
    if (req.user.role !== IRole.ADMIN) {
      if (req.user?.role === IRole.CUSTOMER) {
        filters.customer_id = req.user.uid;
      }
      if (req.user?.role === IRole.DOCTOR) {
        filters.doctor_id = req.user.uid;
      }
    }

    return await this.bookingService.getSingleBooking(
      bookingId,
      filters,
      req.user.role,
    );
  }

  @Post('/payment')
  @Roles(IRole.CUSTOMER, IRole.ADMIN)
  @ApiOperation({ summary: 'Create Payment' })
  @ApiBody({
    type: CreatePaymentDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Create payment success response.',
    type: BookingDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Create payment error response.',
  })
  async createBookingPayment(@Req() req: any, @Body() body: CreatePaymentDto) {
    try {
      console.log('Payment request received:', {
        user: req.user,
        originalBody: body,
        userRole: req.user?.role,
        userUid: req.user?.uid,
      });

      if (req.user.role !== IRole.ADMIN) {
        body.customer_id = req.user.uid;
      }

      console.log('Payment body after processing:', {
        body,
        hasCustomerId: !!body?.customer_id,
        hasDoctorId: !!body?.doctor_id,
        hasServiceId: !!body?.service_id,
      });

      if (!body?.customer_id) {
        throw new HttpException('Customer id require!', HttpStatus.BAD_REQUEST);
      }

      const result = await this.bookingService.createBookingPayment(body);
      console.log('Payment creation successful:', result);
      return result;
    } catch (error) {
      console.error('Payment creation error:', error);
      throw error;
    }
  }

  @Post('/')
  @Roles(IRole.CUSTOMER, IRole.ADMIN)
  @ApiOperation({ summary: 'Create Booking' })
  @ApiBody({
    type: BookingCreateDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Create booking success response.',
    type: BookingDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Create booking error response.',
  })
  async createBooking(@Req() req: any, @Body() body: BookingCreateDto) {
    if (req.user.role !== IRole.ADMIN) {
      body.customer_id = req.user.uid;
    }

    if (!body?.customer_id) {
      throw new HttpException('Customer id require!', HttpStatus.BAD_REQUEST);
    }
    return await this.bookingService.createBooking(body, req.user);
  }

  @Put('/:booking_id')
  @Roles(IRole.CUSTOMER, IRole.DOCTOR, IRole.ADMIN)
  @ApiOperation({ summary: 'Update Booking' })
  @ApiParam({
    name: 'booking_id',
    type: 'string',
    description: 'Booking Id',
  })
  @ApiBody({
    type: BookingUpdateDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Update booking success response.',
    type: BookingDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Update booking error response.',
  })
  async updateBooking(
    @Param('booking_id') bookingId: string,
    @Req() req: any,
    @Body() body: BookingUpdateDto,
  ) {
    if (!bookingId) {
      throw new HttpException('Booking Id is required', HttpStatus.BAD_REQUEST);
    }
    const filters = {} as BookingFilterDto;
    if (req.user.role !== IRole.ADMIN) {
      if (req.user?.role === IRole.CUSTOMER) {
        filters.customer_id = req.user.uid;
      }
      if (req.user?.role === IRole.DOCTOR) {
        filters.doctor_id = req.user.uid;
      }
    }

    return await this.bookingService.updateBooking(
      bookingId,
      filters,
      body,
      req.user,
    );
  }

  @Post('/:booking_id/review')
  @Roles(IRole.CUSTOMER, IRole.ADMIN)
  @ApiOperation({ summary: 'Add Booking Review' })
  @ApiParam({
    name: 'booking_id',
    type: 'string',
    description: 'Booking Id',
  })
  @ApiBody({
    type: ReviewDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Add booking success review response.',
    type: BookingDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Add booking review error response.',
  })
  async addBookingReview(
    @Param('booking_id') bookingId: string,
    @Req() req: any,
    @Body() body: ReviewDto,
  ) {
    if (!bookingId) {
      throw new HttpException('Booking Id is required', HttpStatus.BAD_REQUEST);
    }
    const filters = {} as BookingFilterDto;
    if (req.user?.role === IRole.CUSTOMER) {
      filters.customer_id = req.user.uid;
    }

    return await this.bookingService.addBookingReview(
      bookingId,
      filters,
      body,
      req.user,
    );
  }
}
