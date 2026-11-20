import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class models {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  productMasterId?: number;
}

export class CreateProductMasterDto {
  @ApiProperty()
  @IsInt()
  orgId: number;

  @ApiProperty()
  @IsInt()
  sbuId: number;

  @ApiProperty()
  @IsInt()
  productFamilyId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productDescription?: string;

  @ApiPropertyOptional({ type: [models] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => models)
  model?: models[];

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
