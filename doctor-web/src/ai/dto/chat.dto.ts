import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @ApiProperty({ description: 'Role of the message sender', enum: ['user', 'assistant'] })
  @IsString()
  role: 'user' | 'assistant';

  @ApiProperty({ description: 'Content of the message' })
  @IsString()
  content: string;
}

export class ChatRequestDto {
  @ApiProperty({ description: 'User message', example: 'I have a severe headache' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ 
    description: 'Conversation history for context',
    type: [ChatMessageDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  conversationHistory?: ChatMessageDto[];

  @ApiPropertyOptional({ description: 'Patient preferences (gender, location, etc.)' })
  @IsOptional()
  preferences?: {
    gender?: string;
    location?: string;
    minRating?: number;
  };
}

export class DoctorRecommendationDto {
  @ApiProperty({ description: 'Doctor ID' })
  doctorId: string;

  @ApiProperty({ description: 'Doctor name' })
  name: string;

  @ApiProperty({ description: 'Doctor specialization' })
  specialization: string;

  @ApiProperty({ description: 'Doctor rating' })
  rating: number;

  @ApiProperty({ description: 'Doctor location' })
  location: string;

  @ApiProperty({ description: 'Reason for recommendation' })
  reason: string;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'AI assistant response' })
  response: string;

  @ApiPropertyOptional({ 
    description: 'Extracted patient information',
    type: 'object'
  })
  extractedInfo?: {
    symptoms?: string[];
    urgency?: 'emergency' | 'urgent' | 'routine';
    specialists?: string[];
    summary?: string;
  };

  @ApiPropertyOptional({ 
    description: 'Recommended doctors',
    type: [DoctorRecommendationDto]
  })
  doctorRecommendations?: DoctorRecommendationDto[];

  @ApiProperty({ description: 'Updated conversation history' })
  conversationHistory: ChatMessageDto[];

  @ApiProperty({ description: 'Whether doctor search was performed' })
  searchedDoctors: boolean;
}
