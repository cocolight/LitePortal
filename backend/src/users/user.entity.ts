import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Link } from '../links/link.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @OneToMany(() => Link, link => link.user)
  links: Link[];
}