import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class ServiceDto {
  @ApiProperty({
    description: 'Name of the service',
    example: 'Quick Consultation',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;

  @ApiProperty({
    description: 'Duration of the service',
    example: '30 minutes',
  })
  @IsString({ message: 'Duration must be a string' })
  @IsNotEmpty({ message: 'Duration cannot be empty' })
  duration: string;

  @ApiProperty({
    description: 'Price for the service',
    example: 500,
  })
  @IsNumber({}, { message: 'Price must be a number' })
  @IsNotEmpty({ message: 'Price cannot be empty' })
  price: number;

  @ApiProperty({
    description: 'Description of the service',
    example: 'A quick consultation service for general health concerns',
  })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description cannot be empty' })
  description: string;

  @ApiProperty({
    description: 'ID of the doctor who created the service',
    example: '1234567890',
    required: true,
  })
  @IsString({ message: 'CreatedBy must be a string' })
  @IsNotEmpty({ message: 'CreatedBy cannot be empty' })
  createdBy: string;
}
