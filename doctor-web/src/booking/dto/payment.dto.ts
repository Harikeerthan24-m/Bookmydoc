import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { IPaymentStatus } from '../type';

export class PaymentDto {
  @IsString()
  @IsOptional()
  ephemeralId: string;

  @ApiProperty({
    description: 'The transaction/payment ID for the payment',
    example: 'pay_789',
  })
  @IsString()
  @IsOptional()
  transaction_id: string;

  @ApiProperty({
    description: 'The order ID for the payment',
    example: 'order_789',
  })
  @IsString()
  @IsOptional()
  order_id: string;

  @ApiProperty({
    description: 'The payment signature for the payment',
  })
  @IsString()
  @IsOptional()
  signature: string;

  @ApiProperty({ description: 'The amount of the payment', example: 150 })
  @IsDecimal()
  @IsOptional()
  amount: number | string;

  @ApiProperty({
    description: 'The status of the payment',
    enum: IPaymentStatus,
  })
  @IsEnum(IPaymentStatus)
  @IsOptional()
  status: IPaymentStatus;
}

export class CreatePaymentDto {
  @ApiPropertyOptional({
    description: 'The ID of the customer',
    example: 'cust456',
  })
  @IsNotEmpty({ message: 'Customer ID is required' })
  customer_id: string;

  @ApiProperty({ description: 'The ID of the doctor', example: 'doc789' })
  @IsString()
  @IsNotEmpty()
  doctor_id: string;

  @ApiProperty({ description: 'The ID of the service', example: 'ser589' })
  @IsString()
  @IsNotEmpty()
  service_id: string;

  @ApiPropertyOptional({ description: 'Service object for validation context' })
  @IsOptional()
  service?: any;
}
