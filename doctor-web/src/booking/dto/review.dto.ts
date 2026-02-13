import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
  IsNumber,
} from 'class-validator';

export class ReviewDto {
  @ApiProperty({
    description: 'The comment of the review',
  })
  @IsString()
  @MaxLength(1000)
  comment: string;

  @ApiProperty({ description: 'The rating of the review' })
  @IsNumber()
  @Transform((input) => parseInt(input.value))
  @Max(5)
  @Min(1)
  rating: number;

  @ApiPropertyOptional({
    description: 'The date time of the review',
  })
  @IsDateString()
  @IsOptional()
  datetime: string;
}
