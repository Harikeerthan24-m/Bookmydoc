import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class TtsDto {
  @ApiProperty({
    description: 'Text for the AI assistant to speak',
    example:
      "Based on your symptoms, I recommend consulting with a cardiologist. I've shown some doctors on your screen.",
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  text: string;
}
