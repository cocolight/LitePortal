import { ApiProperty } from '@nestjs/swagger';
export class CreateLinkDto {
  @ApiProperty({description: 'Link id, 自动生成'})
  linkId?: string;

  @ApiProperty({ required: false, description: 'Link 名称',example: '百度'})
  name?: string;

  @ApiProperty({required: false, description: '在线图标地址',example: 'https://www.baidu.com'})
  onlineIcon?: string;

  @ApiProperty({required: false, description: '文字图标',example: 'BD'})
  textIcon?: string;

  @ApiProperty({required: false, description: '上传图标地址',example: 'https://www.baidu.com'})
  uploadIcon?: string;

  @ApiProperty({required: false, description: '图标库图标编码',example: 'safdsgsd'})
  paidIcon?: string;

  @ApiProperty({required: false, description: '图标类型', enum: ['online_icon', 'text_icon', 'upload_icon', 'paid_icon']})
  iconType?: string;

  @ApiProperty({required: false, description: '内网地址',example: 'https://192.168.1.1'})
  intUrl?: string;

  @ApiProperty({required: false, description: '外网地址',example: 'https://www.baidu.com'})
  extUrl?: string;

  @ApiProperty({required: false, description: '备注'})
  desc?: string;
}

export class DeleteLinkDto {
  @ApiProperty({required: true, description: 'Link id'})
  linkId!: string;
}
