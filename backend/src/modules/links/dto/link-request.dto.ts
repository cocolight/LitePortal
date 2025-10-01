import { ApiProperty } from '@nestjs/swagger';
import { PartialType, OmitType } from '@nestjs/mapped-types'
import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';

export class CreateLinkDto {
  // @IsOptional()
  // @IsString()
  // @ApiProperty({description: 'Link id, 自动生成'})
  // linkId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: true, description: 'Link 名称', example: '百度' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '在线图标地址', example: 'https://www.baidu.com/favicon.ico' })
  onlineIcon?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '文字图标', example: 'BD' })
  textIcon?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '上传图标地址', example: 'https://example.com/icon.png' })
  uploadIcon?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '图标库图标编码', example: 'icon-code' })
  paidIcon?: string;

  @IsOptional()
  @IsEnum(['online_icon', 'text_icon', 'upload_icon', 'paid_icon'])
  @ApiProperty({
    description: '图标类型',
    enum: ['online_icon', 'text_icon', 'upload_icon', 'paid_icon'],
    default: 'online_icon'
  })
  iconType?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '内网地址', example: 'https://192.168.1.1' })
  intUrl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '外网地址', example: 'https://www.baidu.com' })
  extUrl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '备注' })
  desc?: string;
}

export class UpdateLinkDto extends PartialType(CreateLinkDto) {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Link id' })
  linkId!: string;
}
