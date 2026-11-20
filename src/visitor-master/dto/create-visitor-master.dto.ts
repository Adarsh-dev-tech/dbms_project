import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateVisitorIntProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  productFamilyId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  orgId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sbuId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  productId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  visitorMasterId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  modelId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  noOfMachines?: number;
}

export class CreateVisitorDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  orgId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sbuId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobileNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  visitorMasterId?: number;
}

export class CreateVisitorMasterDto {
  @ApiProperty()
  @IsInt()
  orgId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sbuId?: number;

  @ApiProperty()
  @IsInt()
  campaignId: number;

  @ApiProperty()
  @IsInt()
  industryTypeId: number;

  @ApiProperty()
  @IsInt()
  userId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  companyType?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  pincode?: number;

  @ApiProperty()
  @IsInt()
  stateId: number;

  @ApiProperty()
  @IsInt()
  districtId: number;

  @ApiPropertyOptional({ type: [CreateVisitorIntProductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVisitorIntProductDto)
  productsInterested?: CreateVisitorIntProductDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  attachmentId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  noOfGifts?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  giftDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planningTimeline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  financingReuired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  noOfPeopleAccompanied?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  noOfGiftsNeeded?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({ type: [CreateVisitorDetailsDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVisitorDetailsDto)
  visitorDetails?: CreateVisitorDetailsDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean = true;
}
