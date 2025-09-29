// link-response.dto.ts
import { Expose } from 'class-transformer';

export class LinkResponseDto {
  @Expose()
  linkId!: string;

  @Expose()
  name!: string;

  @Expose()
  onlineIcon?: string;

  @Expose()
  textIcon?: string;

  @Expose()
  uploadIcon?: string;

  @Expose()
  paidIcon?: string;

  @Expose()
  iconType!: string;

  @Expose()
  intUrl?: string;

  @Expose()
  extUrl?: string;

  @Expose()
  desc?: string;

  // 不暴露 created_at / updated_at / id / user 等内部字段
}