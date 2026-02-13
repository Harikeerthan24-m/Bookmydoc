import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class AddressDto {
  @ApiPropertyOptional({
    description: 'Address of the profile',
    example: '123 Main St',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'City of the profile',
    example: 'Anytown',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State of the profile',
    example: 'CA',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Country of the profile',
    example: 'USA',
  })
  @IsOptional()
  @IsString()
  country?: string;
}
