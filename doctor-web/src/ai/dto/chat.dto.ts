import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @ApiProperty({
    description: 'Role of the message sender',
    enum: ['user', 'assistant'],
  })
  @IsString()
  role: 'user' | 'assistant';

  @ApiProperty({ description: 'Content of the message' })
  @IsString()
  content: string;
}

export class ChatRequestDto {
  @ApiProperty({
    description: 'User message',
    example: 'I have a severe headache',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Conversation history for context',
    type: [ChatMessageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  conversationHistory?: ChatMessageDto[];

  @ApiPropertyOptional({
    description: 'Patient preferences (gender, location, etc.)',
  })
  @IsOptional()
  preferences?: {
    gender?: string;
    location?: string;
    minRating?: number;
  };

  @ApiPropertyOptional({
    description:
      'True when the previous assistant response showed doctor recommendations (follow-up turn). Ensures conversationStage is post_recommendation.',
  })
  @IsOptional()
  previousTurnHadDoctorRecommendations?: boolean;

  @ApiPropertyOptional({
    description:
      "Patient's display name. AI will use it naturally in replies (e.g. first greeting, acknowledgments) for a human touch.",
  })
  @IsOptional()
  userName?: string;

  @ApiPropertyOptional({
    description:
      'How the user sent this message: "text" (typed in chat) or "voice" (spoken, then transcribed). Used for session storage and UI (e.g. show mic icon); AI always receives plain text.',
    enum: ['text', 'voice'],
  })
  @IsOptional()
  inputType?: 'text' | 'voice';

  @ApiPropertyOptional({
    description:
      'Request source. Use "search" for the home/Explore Ask AI search bar (direct specialist recommendation, no clarification questions, and does not persist to chat history).',
    enum: ['chat', 'voice', 'search'],
  })
  @IsOptional()
  @IsString()
  source?: 'chat' | 'voice' | 'search';
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
    type: 'object',
  })
  extractedInfo?: {
    symptoms?: string[];
    urgency?: 'emergency' | 'urgent' | 'routine';
    specialists?: string[];
    summary?: string;
    conversationStage?: 'gathering' | 'recommending' | 'post_recommendation';
    inputType?:
      | 'valid'
      | 'out_of_context'
      | 'gibberish'
      | 'emotional'
      | 'jailbreak'
      | 'filler';
  };

  @ApiPropertyOptional({
    description: 'Recommended doctors',
    type: [DoctorRecommendationDto],
  })
  doctorRecommendations?: DoctorRecommendationDto[];

  @ApiProperty({ description: 'Updated conversation history' })
  conversationHistory: ChatMessageDto[];

  @ApiProperty({ description: 'Whether doctor search was performed' })
  searchedDoctors: boolean;
}
