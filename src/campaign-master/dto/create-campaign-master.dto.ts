import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCampaignMasterDto {
  @ApiProperty()
  @IsInt()
  orgId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  campaignName: string;

  @ApiProperty()
  @IsInt()
  campaignTypeId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-12-01' })
  @IsString()
  @IsNotEmpty()
  fromDate: string;

  @ApiProperty({ example: '2026-12-05' })
  @IsString()
  @IsNotEmpty()
  toDate: string;

  @ApiProperty()
  @IsInt()
  stateId: number;

  @ApiProperty()
  @IsInt()
  districtId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campaignObjective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  createdOn?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modifiedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  modifiedOn?: Date;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean = true;
}
