import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkController } from './link.controller';
import { LinkService } from './link.service';
import { Link } from './link.entity';
import { User } from '../users/user.entity';
import { UserService } from '../users/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([Link, User])],
  controllers: [LinkController],
  providers: [LinkService, UserService],
  exports: [LinkService],
})
export class LinkModule {}