import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Link {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.links)
  user: User;

  @Column()
  link_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  online_icon: string;

  @Column({ nullable: true })
  text_icon: string;

  @Column({ nullable: true })
  upload_icon: string;

  @Column({ default: 'online_icon' })
  icon_type: string;

  @Column()
  int_url: string;

  @Column()
  ext_url: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}