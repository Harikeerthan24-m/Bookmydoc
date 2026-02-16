import {
  Body,
  Controller,
  Post,
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
import { AiService, IClassificationResult } from './ai.service';
import { ClassifySymptomsDto } from './dto/classify-symptoms.dto';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';

@Controller('ai')
@ApiBearerAuth()
@ApiTags('ai')
@UseGuards(RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('classify-symptoms')
  @Roles(IRole.CUSTOMER, IRole.ADMIN)
  @ApiOperation({
    summary: 'Classify symptoms and get specialist recommendations',
  })
  @ApiResponse({ status: 200, description: 'Classification successful' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async classifySymptoms(@Body() dto: ClassifySymptomsDto): Promise<{
    statusCode: number;
    data: IClassificationResult;
    message: string;
  }> {
    const result = await this.aiService.classifySymptoms(dto);
    return {
      statusCode: 200,
      data: result,
      message: 'Classification successful',
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
    description: 'Engage in a conversation about health concerns. The AI will ask questions, extract patient information, and recommend suitable doctors.',
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
}
