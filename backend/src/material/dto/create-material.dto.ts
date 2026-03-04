import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateMaterialImageItemDto {
  @ApiProperty({
    description: '图片 URL（上传接口返回的 url，即文件名）',
    example: 'abc123.jpg',
  })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: '该图片描述' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateMaterialDto {
  @ApiPropertyOptional({ description: '物料标题', default: '未命名物料' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: '物料描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '图片列表（每项为上传接口返回的 url 及可选描述）',
    type: [CreateMaterialImageItemDto],
    default: [],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMaterialImageItemDto)
  images: CreateMaterialImageItemDto[] = [];
}
