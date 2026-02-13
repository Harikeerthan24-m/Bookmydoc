import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Name of the user' })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ description: 'Email of the user' })
  email: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({ description: 'Password of the user' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "User's role", enum: ['doctor', 'customer'] })
  role: 'admin' | 'doctor' | 'customer';

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Google Authentication Token' })
  token?: string;

  @IsOptional()
  @ApiProperty({ description: 'Providers type', enum: ['apple', 'google'] })
  provider?: 'google' | 'apple' | false;
}
