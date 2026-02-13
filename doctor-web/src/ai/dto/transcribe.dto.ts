import { ApiProperty } from '@nestjs/swagger';

export class TranscribeResponseDto {
  @ApiProperty({
    description: 'Transcribed text from audio',
    example: 'I have a headache',
  })
  text: string;
}
