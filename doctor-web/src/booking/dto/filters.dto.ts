import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IBookingStatus } from '../type';

export class BookingFilterDto {
  @ApiPropertyOptional({
    description: 'The ID of the customer',
    example: '12345',
  })
  @IsString()
  @IsOptional()
  customer_id?: string;

  @ApiPropertyOptional({
    description: 'The ID of the doctor',
    example: '67890',
  })
  @IsString()
  @IsOptional()
  doctor_id?: string;

  @ApiPropertyOptional({
    description: 'The status of the booking',
    enum: IBookingStatus,
    example: IBookingStatus.CONFIRMED,
  })
  @IsEnum(IBookingStatus)
  @IsOptional()
  status?: IBookingStatus;

  @ApiPropertyOptional({
    description: 'The date of the booking',
    example: '2024-09-09',
  })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    description: 'order by booking',
  })
  @IsString()
  @IsOptional()
  order_by?: 'asc' | 'desc';
}
