import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Google Authentication Token' })
  token: string;

  @IsOptional()
  @ApiProperty({ description: 'Providers type', enum: ['apple', 'google'] })
  provider?: 'google' | 'apple' | false;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "User's role", enum: ['doctor', 'customer'] })
  role: 'admin' | 'doctor' | 'customer';
}
