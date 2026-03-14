import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from '@app/auth/guard/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { IRole } from '@app/common/types/type';
import { AiService } from './ai.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';
import { TtsDto } from './dto/tts.dto';

@Controller('ai')
@ApiBearerAuth()
@ApiTags('ai')
@UseGuards(RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('chat/history')
  @Roles(IRole.CUSTOMER, IRole.ADMIN)
  @ApiOperation({
    summary:
      'Get current user’s chat history (paginated). Most recent first; use `before` to load older messages.',
  })
  @ApiResponse({ status: 200, description: 'Chat history retrieved' })
  async getChatHistory(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ): Promise<{
    statusCode: number;
    data: {
      session: Record<string, any>;
      conversationHistory: Array<{ role: string; content: string }>;
      messages: Array<{
        id: string;
        role: string;
        content: string;
        doctors?: any[];
      }>;
      nextCursor: string | null;
    };
    message: string;
  }> {
    const userId = req?.user?.uid || req?.user?.userId;
    const limitNum = limit ? Math.min(parseInt(limit, 10) || 25, 50) : 25;
    const result = await this.aiService.getChatHistory(
      userId,
      limitNum,
      before?.trim() || undefined,
    );
    return {
      statusCode: 200,
      data: result,
      message: 'Chat history retrieved successfully',
    };
  }

  @Post('transcribe')
  @Roles(IRole.CUSTOMER, IRole.ADMIN)
  @UseInterceptors(FileInterceptor('audio'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Transcribe audio to text using OpenAI Whisper' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Transcription successful' })
  @ApiResponse({ status: 400, description: 'Audio file required' })
  async transcribeAudio(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ statusCode: number; data: { text: string }; message: string }> {
    const result = await this.aiService.transcribeAudio(file);
    return {
      statusCode: 200,
      data: result,
      message: 'Transcription successful',
    };
  }

  @Post('chat')
  @Roles(IRole.CUSTOMER, IRole.ADMIN)
  @ApiOperation({
    summary: 'Chat with AI healthcare assistant and get doctor recommendations',
    description:
      'Engage in a conversation about health concerns. The AI will ask questions, extract patient information, and recommend suitable doctors.',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat response with doctor recommendations',
    type: ChatResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async chat(
    @Body() dto: ChatRequestDto,
    @Req() req: any,
  ): Promise<{
    statusCode: number;
    data: ChatResponseDto;
    message: string;
  }> {
    const userId = req?.user?.uid || req?.user?.userId;
    const result = await this.aiService.chat(dto, userId);
    return {
      statusCode: 200,
      data: result,
      message: 'Chat response generated successfully',
    };
  }

  @Post('tts')
  @Roles(IRole.CUSTOMER, IRole.ADMIN)
  @ApiOperation({
    summary: 'Convert assistant text to speech (TTS)',
    description:
      'Generates spoken audio for a given assistant response text. Returns base64-encoded audio that the client can play.',
  })
  @ApiResponse({
    status: 200,
    description: 'TTS successful',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async tts(@Body() dto: TtsDto): Promise<{
    statusCode: number;
    data: { audioBase64: string; mimeType: string };
    message: string;
  }> {
    const result = await this.aiService.synthesizeSpeech(dto.text);
    return {
      statusCode: 200,
      data: result,
      message: 'Text-to-speech successful',
    };
  }
}
