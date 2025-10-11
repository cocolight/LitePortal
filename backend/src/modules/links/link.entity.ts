import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn
} from 'typeorm';
import type{ User } from '../users/user.entity';

@Entity()
export class Link {
  /** 数据库主键，自增，仅内部使用，不返回给前端 */
  @PrimaryGeneratedColumn()
  id!: number;

  /** 对外业务主键，由代码生成（UUID / 雪花等） */
  @Column({ name: 'link_id', unique: true })
  linkId!: string;

  /** 所属用户 */
  // @ManyToOne(() => User, (user) => user.links, { onDelete: 'CASCADE' })
  @ManyToOne<User>('User', user => user.links, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ name: 'name' })
  name!: string;

  @Column({ name: 'online_icon', nullable: true })
  onlineIcon?: string;

  @Column({ name: 'text_icon', nullable: true })
  textIcon?: string;

  @Column({ name: 'upload_icon', nullable: true })
  uploadIcon?: string;

  @Column({ name: 'paid_icon', nullable: true })
  paidIcon?: string;

  @Column({ name: 'icon_type', default: 'online_icon' })
  iconType!: string;

  @Column({ name: 'int_url', nullable: true })
  intUrl?: string;

  @Column({ name: 'ext_url', nullable: true })
  extUrl?: string;

  @Column({ name: 'desc', nullable: true })
  desc?: string;

  /** 创建时间，自动写入，无需手动赋值 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** 更新时间，自动维护，无需手动赋值 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })  // 软删除
  deletedAt?: Date;
}