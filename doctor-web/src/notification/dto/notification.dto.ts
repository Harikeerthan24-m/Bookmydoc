import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationContextDto {
  @ApiPropertyOptional({
    description: 'Booking ID associated with the notification',
  })
  booking_id?: string;

  @ApiPropertyOptional({
    description: 'Payment ID associated with the notification',
  })
  payment_id?: string;

  @ApiPropertyOptional({
    description: 'Service name associated with the notification',
  })
  service_name?: string;

  @ApiPropertyOptional({
    description: 'Payment amount associated with the notification',
  })
  amount?: number;

  @ApiPropertyOptional({
    description: 'Available actions for this notification',
    type: [String],
  })
  actions?: string[];
}

export class NotificationUserDto {
  @ApiProperty({ description: 'User ID' })
  uid: string;

  @ApiProperty({ description: 'User display name' })
  name: string;

  @ApiProperty({ description: 'User role' })
  role: string;
}

export class NotificationDto {
  @ApiProperty({ description: 'Notification ID' })
  id: string;

  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Notification body text' })
  body: string;

  @ApiProperty({ description: 'Notification type' })
  type: string;

  @ApiProperty({ description: 'Whether the notification has been read' })
  read: boolean;

  @ApiProperty({
    description: 'Notification receiver details',
    type: NotificationUserDto,
  })
  receiver: NotificationUserDto;

  @ApiProperty({
    description: 'Notification sender details',
    type: NotificationUserDto,
  })
  sender: NotificationUserDto;

  @ApiProperty({
    description: 'Additional notification context',
    type: NotificationContextDto,
  })
  context: NotificationContextDto;

  @ApiProperty({ description: 'Notification creation timestamp' })
  createdAt: string;
}

export class NotificationResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({
    description: 'Array of notifications',
    type: [NotificationDto],
  })
  data: NotificationDto[];

  @ApiPropertyOptional({ description: 'Error message if any' })
  error?: string;
}
