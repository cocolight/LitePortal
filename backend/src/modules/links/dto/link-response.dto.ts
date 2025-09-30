// link-response.dto.ts
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';

export class LinkResponseDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true, description: '链接ID' })
  linkId!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true, description: '链接名称' })
  name!: string;

  @Expose()
  @IsString()
  @IsOptional()
  @ApiProperty({ description: '链接在线图标地址' })
  onlineIcon?: string;

  @Expose()
  @IsString()
  @IsOptional()
  @ApiProperty({ description: '链接文本图标' })
  textIcon?: string;

  @Expose()
  @IsString()
  @IsOptional()
  @ApiProperty({ description: '链接上传图标地址' })
  uploadIcon?: string;

  @Expose()
  @IsString()
  @IsOptional()
  @ApiProperty({ description: '链接付费图标地址' })
  paidIcon?: string;

  @Expose()
  @IsString()
  @IsEnum(['online_icon', 'text_icon', 'upload_icon', 'paid_icon'])
  @ApiProperty({ description: '当前默认图标类型' })
  iconType!: string;

  @Expose()
  @IsString()
  @IsOptional()
  @ApiProperty({ description: '内部链接地址' })
  intUrl?: string;

  @Expose()
  @IsString()
  @IsOptional()
  @ApiProperty({ description: '外部链接地址' })
  extUrl?: string;

  @Expose()
  @IsString()
  @IsOptional()
  @ApiProperty({ description: '链接描述' })
  desc?: string;

  // 不暴露 created_at / updated_at / id / user 等内部字段
}