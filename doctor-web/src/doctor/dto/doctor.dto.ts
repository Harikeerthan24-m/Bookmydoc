import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsDecimal } from 'class-validator';
import { IDay } from '../type';
import { ProfileDto } from '@app/profile/dto/profile.dto';
import { AvailabilitySlot } from '@app/availability/dto/availability.dto';
import { BookingDto, ServiceDto } from '@app/booking/dto/booking.dto';

export class DoctorDto extends ProfileDto {
  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Ratings of the doctor' })
  ratings: [number];

  @IsDecimal()
  @IsOptional()
  @ApiPropertyOptional({ description: 'The star ratting' })
  star_rating: number;

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Services providing by the doctor',
    type: [ServiceDto],
  })
  providingServices?: ServiceDto[];

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Availability days of the doctor',
    enum: () => [IDay],
  })
  availability?: IDay[];

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Availability slots of the doctor',
    type: [AvailabilitySlot],
  })
  availabilitySlots?: AvailabilitySlot[];

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Bookings of the doctor',
    type: () => [BookingDto],
  })
  bookings?: BookingDto[];
}
