import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class AuthLoginDto {
  @ApiProperty({ example: 'admin@exhibition.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: 'WEB', default: 'WEB' })
  @IsOptional()
  @IsString()
  platform?: string;
}

export class AuthRegisterDto {
  @ApiProperty({ example: 'Nova Tech Expo' })
  @IsString()
  @IsNotEmpty()
  orgName: string;

  @ApiProperty({ example: 'Alex Rivera' })
  @IsString()
  @IsNotEmpty()
  orgContactName: string;

  @ApiProperty({ example: 'alex@novatech.local' })
  @IsEmail()
  orgEmail: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  orgMobileNo: string;

  @ApiProperty({ example: 'StrongPass123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'Mumbai, Maharashtra' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 400001 })
  @IsOptional()
  @IsInt()
  pincode?: number;
}
