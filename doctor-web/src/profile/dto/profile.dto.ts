import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  IsDecimal,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { AddressDto } from './address.dto';
import { Transform, Type } from 'class-transformer';

export class ProfileDto {
  // @IsOptional()
  // @IsString()
  // @ApiPropertyOptional({ description: 'Display name of the profile' })
  // display_name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'User name of the profile' })
  user_name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Email of the profile' })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Stripe customer id of the profile' })
  stripe_id?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Role of the profile' })
  role?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Phone of the profile' })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Title of the profile' })
  title?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Bio of the profile' })
  bio?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Gender of the profile' })
  gender?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Age of the profile' })
  age?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Experience of the profile' })
  experience?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Doctor registration number' })
  doctor_registration_number?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Hospital name' })
  hospital_name?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    // If it's already an array, clean it up
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    // If it's a string, try to parse it as JSON first
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed
            .map((v) => String(v).trim())
            .filter((v) => v.length > 0);
        }
      } catch {
        // If JSON parsing fails, try splitting by comma
        return value
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
      }
    }
    // If all else fails, return empty array
    return [];
  })
  @ApiPropertyOptional({
    description: 'List of doctor specialties',
    type: [String],
  })
  expertiseList?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.map((v) => String(v).trim()).filter((v) => v.length > 0)
          : [];
      } catch {
        return value
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
      }
    }
    return [];
  })
  @ApiPropertyOptional({
    description: 'Services of the profile',
    type: [String],
  })
  services?: string[]; // Array of service IDs

  @IsOptional()
  // @ValidateNested()
  @Type(() => AddressDto) // Ensure class-transformer is installed and used
  @ApiPropertyOptional({
    description: 'The address information of the location',
    type: AddressDto,
  })
  location?: AddressDto;

  @IsDecimal()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Height of the profile' })
  height?: number;

  @IsDecimal()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Weight of the profile' })
  weight?: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Blood group of the profile' })
  blood_group?: string;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Date of birth of the profile' })
  dob?: string;

  @IsBoolean()
  @Transform((params) => {
    return ![false, 'false', 'False'].includes(String(params?.value));
  })
  @IsOptional()
  @ApiPropertyOptional({ description: 'Notification settings of the profile' })
  notification_enabled?: boolean;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Notification settings of the profile' })
  notification_tokens?: any;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.map((v) => String(v).trim()).filter((v) => v.length > 0)
          : [];
      } catch {
        return value
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
      }
    }
    return [];
  })
  @ApiPropertyOptional({
    description: 'Medical conditions of the profile',
    type: [String],
  })
  medical_conditions?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.map((v) => String(v).trim()).filter((v) => v.length > 0)
          : [];
      } catch {
        return value
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
      }
    }
    return [];
  })
  @ApiPropertyOptional({
    description: 'Allergies of the profile',
    type: [String],
  })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.map((v) => String(v).trim()).filter((v) => v.length > 0)
          : [];
      } catch {
        return value
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
      }
    }
    return [];
  })
  @ApiPropertyOptional({
    description: 'Drug intakes of the profile',
    type: [String],
  })
  drug_intakes?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.map((v) => String(v).trim()).filter((v) => v.length > 0)
          : [];
      } catch {
        return value
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
      }
    }
    return [];
  })
  @ApiPropertyOptional({
    description: 'Treatment history of the profile',
    type: [String],
  })
  treatment_history?: string[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Sex of the profile' })
  sex?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'BMI of the profile (auto-calculated)' })
  bmi?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'CreatedAt timestamp' })
  createdAt?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'UpdatedAt timestamp' })
  updatedAt?: string;
}
