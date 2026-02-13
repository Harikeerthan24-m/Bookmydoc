import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDecimal, IsOptional, IsString } from 'class-validator';

export class DoctorFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by doctor gender',
    example: 'male',
    enum: ['male', 'female', 'other'],
  })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({
    description: 'Filter by location/area',
    example: 'New York',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    description: 'Minimum rating filter (1-5)',
    example: 4,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal()
  @IsOptional()
  minRating?: number;
  @ApiPropertyOptional({
    description: 'Search By doctor name or expertise',
    example: 'doctor x',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'The name of the doctor',
    example: 'doctor x',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'The service of the doctor',
    example: 'service x',
  })
  @IsString()
  @IsOptional()
  service?: string;

  @ApiPropertyOptional({
    description:
      'Filter by specialist/expertise. Comma-separated for multiple (e.g. Cardiologist,General Physician)',
    example: 'Cardiologist,General Physician',
  })
  @IsString()
  @IsOptional()
  expertise?: string;

  @ApiPropertyOptional({
    description: 'The availability of the doctor',
    example: 10,
  })
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  availability?: boolean;

  @ApiPropertyOptional({
    description: 'The limit of the doctor',
    example: 10,
  })
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  limit?: number;
}
