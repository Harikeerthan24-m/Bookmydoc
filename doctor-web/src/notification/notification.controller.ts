import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '@app/auth/guard/roles.guard';
import { NotificationService } from './notification.service';
import { NotificationResponseDto } from './dto/notification.dto';

@ApiTags('notifications')
@Controller('notifications')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'No notifications found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getNotifications(@Req() req: any) {
    const userId = req.user?.uid;
    return this.notificationService.getNotifications(userId);
  }

  @Post(':id/read')
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Post('read-all')
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async markAllAsRead(@Req() req: any) {
    const userId = req.user?.uid;
    return this.notificationService.markAllAsRead(userId);
  }
}
