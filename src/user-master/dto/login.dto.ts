import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@exhibition.local' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Admin@123' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: '1.0' })
  @IsOptional()
  @IsString()
  androidVersion?: string;

  @ApiPropertyOptional({ example: '1.0' })
  @IsOptional()
  @IsString()
  iosVersion?: string;

  @ApiPropertyOptional({ example: 'WEB', default: 'WEB' })
  @IsOptional()
  @IsString()
  platform?: string;
}
