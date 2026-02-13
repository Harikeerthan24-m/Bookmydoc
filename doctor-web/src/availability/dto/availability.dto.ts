import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IDay } from '../type';

export class AvailabilitySlot {
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The ID of the slot', example: 'slot123' })
  slot_id: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The doctor Id for the slot', example: 'uid456' })
  uid: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The day of the slot', enum: IDay })
  day: IDay;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Start time of the slot', example: '09:00' })
  start_time: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'End time of the slot', example: '10:00' })
  end_time: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Duration of the slot in minutes',
    example: 60,
  })
  duration: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Slot created at',
    example: '2024-09-01T12:00:00Z',
  })
  created_at?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Slot updated at',
    example: '2024-09-01T12:00:00Z',
  })
  updated_at?: string;
}
