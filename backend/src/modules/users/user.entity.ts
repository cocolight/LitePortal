import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { Link } from '../links/link.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  // @OneToMany(() => Link, link => link.user)
  @OneToMany<Link>('Link', link => link.user)
  links!: Link[];
}