// src/modules/init/init.entity.ts

import { Entity, PrimaryColumn, Column, CreateDateColumn, } from 'typeorm';

@Entity()
export class Init {
  @PrimaryColumn()
  key!: string;

  @Column()
  value!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
