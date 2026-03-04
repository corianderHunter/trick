import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateMaterialImageItemDto } from './create-material.dto';

export class UpdateMaterialDto {
  @ApiPropertyOptional({ description: '物料标题' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: '物料描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '图片列表（替换全部，每项为上传返回的 url 及可选描述）',
    type: [CreateMaterialImageItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMaterialImageItemDto)
  images?: CreateMaterialImageItemDto[];
}
