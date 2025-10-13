import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import type { Link } from '../links/link.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // @OneToMany(() => Link, link => link.user)
  @OneToMany<Link>('Link', link => link.user)
  links!: Link[];
}