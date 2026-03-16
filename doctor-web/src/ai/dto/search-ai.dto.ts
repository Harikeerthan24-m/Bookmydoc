import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchAiRequestDto {
  @ApiProperty({
    description:
      'Free-text description of the patient symptoms or problem for Ask AI in the home/Explore search bar.',
    example: 'I have had a headache and fever for 2 days',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description:
      "Patient's display name. Used only to personalize the assistant's wording; does not affect the specialist choice.",
  })
  @IsOptional()
  @IsString()
  userName?: string;
}
