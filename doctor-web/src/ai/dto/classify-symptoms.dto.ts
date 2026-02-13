import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ClassifySymptomsDto {
  @ApiProperty({
    description: 'Patient symptom or health concern description',
    example: 'I have severe headache and fever for 2 days',
    minLength: 3,
  })
  @IsString()
  @MinLength(3, {
    message: 'Please provide a detailed description (at least 3 characters)',
  })
  description: string;
}
